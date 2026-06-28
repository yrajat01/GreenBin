require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

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
const User = require('./models/User');

// Initialize Firebase
initFirebase();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all for testing, restrict in prod
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
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

// API Routes
app.use('/api/bins', binRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Root path details
app.get('/', (req, res) => {
  res.json({
    name: 'GreenBin Smart Waste System API',
    status: 'Running',
    version: '1.0.0',
    simulations: 'Enabled (30s interval)'
  });
});

// Trigger seeding if database is empty or if query parameter ?seed=true is passed
app.get('/api/seed', async (req, res) => {
  try {
    await seedData();
    res.json({ message: 'Database seeded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Seed check: seed if no bins or users exist
    const binCount = await Bin.countDocuments();
    const userCount = await User.countDocuments();
    if (binCount === 0 || userCount === 0) {
      console.log('No bins or users found in database. Seeding default dataset...');
      await seedData();
    }
    
    // Start Server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      
      // Start IoT Simulation
      startSimulation(io);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
