const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Configuration & Database
const env = require('./config/env');
const connectDB = require('./config/db');
const initFirebase = require('./config/firebase');
const logger = require('./utils/logger');

// Middlewares
const errorHandler = require('./middleware/errorHandler');

// Domain Routes & Services
const apiRoutes = require('./routes');
const seedData = require('./services/seed');
const { startSimulation } = require('./services/simulation');
const Bin = require('./models/Bin');

// Initialize Firebase Admin (optional / fallback)
initFirebase();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Production readiness: proxy trust & security headers
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS Validation
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, server-to-server
  if (!env.isProduction) return true;
  if (env.clientUrls.includes(origin) || env.clientUrls.includes('*')) return true;
  if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    logger.warn(`Blocked by CORS: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.debug(`Socket Client Connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.debug(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Attach socket.io instance to app for controller access
app.set('io', io);

// Health check handler
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Seed trigger route
app.get('/api/seed', async (req, res, next) => {
  try {
    await seedData();
    res.json({ message: 'Database infrastructure seeded successfully!' });
  } catch (error) {
    next(error);
  }
});

// Mount Scalable API Routes
app.use('/api', apiRoutes);

// Static client serving if built client exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  logger.info(`Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'GreenBin Smart Waste System API',
      status: 'Running',
      version: '1.0.0',
      simulations: 'Enabled',
      endpoints: {
        health: '/api/health',
        bins: '/api/bins',
        reports: '/api/reports',
        route: '/api/route',
        leaderboard: '/api/leaderboard',
        users: '/api/users',
      },
    });
  });
}

// Centralized Error Handling Middleware (must be after all routes)
app.use(errorHandler);

const PORT = env.port;

const startServer = async () => {
  try {
    const binCount = await Bin.countDocuments();
    if (binCount === 0) {
      logger.info('No bins found in database. Initializing smart bins infrastructure...');
      await seedData();
    }

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${PORT} in ${env.nodeEnv} mode.`);
      startSimulation(io);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
  }
};

startServer();

// Graceful shutdown handling
const handleShutdown = (signal) => {
  logger.info(`\n${signal} received. Initiating graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    }).catch(() => process.exit(0));
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
