const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const initFirebase = require('./config/firebase');
const seedData = require('./services/seed');
const { startSimulation } = require('./services/simulation');

// Import routes
const binRoutes = require('./routes/binRoutes');
const reportRoutes = require('./routes/reportRoutes');
const routeRoutes = require('./routes/routeRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const userRoutes = require('./routes/userRoutes');

// Import Models for initial seeding check
const Bin = require('./models/Bin');

// Initialize Firebase
initFirebase();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Production readiness: proxy trust & security headers
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Configure CORS for HTTP and WebSockets
const rawClientUrl = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, server-to-server
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  // Allow Vercel preview and production deployments, and Render apps
  if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked by CORS: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to avoid dropping live socket telemetry
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`New Socket Client Connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Set socket io on app context to make it accessible in routes
app.set('io', io);

// Health check endpoints for cloud PaaS (Render, Railway, AWS, Fly.io)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/bins', binRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Trigger seeding if database has no bins or if manually requested
app.get('/api/seed', async (req, res) => {
  try {
    await seedData();
    res.json({ message: 'Database infrastructure seeded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

// Root API information endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GreenBin Smart Waste System API',
    status: 'Running',
    version: '1.0.0',
    simulations: 'Enabled (30s interval)'
  });
});

// Static client serving if built client exists (supports monolithic / single-service deployments)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API GET routes
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
} else {
  // If no static client build exists, root path shows API status
  app.get('/', (req, res) => {
    res.json({
      name: 'GreenBin Smart Waste System API',
      status: 'Running',
      version: '1.0.0',
      simulations: 'Enabled (30s interval)',
      endpoints: {
        health: '/api/health',
        bins: '/api/bins',
        reports: '/api/reports',
        route: '/api/route',
        leaderboard: '/api/leaderboard',
        users: '/api/users'
      }
    });
  });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Seed check: seed bin infrastructure only if no bins exist in database
    const binCount = await Bin.countDocuments();
    if (binCount === 0) {
      console.log('No bins found in database. Initializing smart bins infrastructure...');
      await seedData();
    }
    
    // Start Server bound to all network interfaces (0.0.0.0)
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      
      // Start IoT Simulation
      startSimulation(io);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

// Graceful shutdown handling for container and cloud platforms
const handleShutdown = (signal) => {
  console.log(`\n${signal} received. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch(() => process.exit(0));
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
