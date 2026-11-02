/**
 * Centralized Environment Configuration & Validation
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server directory or root fallback
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const parseClientUrls = (raw) => {
  if (!raw) return ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
  const origins = raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return Array.from(new Set(['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', ...origins]));
};

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greenbin',
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
  depot: {
    lat: parseFloat(process.env.DEPOT_LAT) || 26.8467,
    lng: parseFloat(process.env.DEPOT_LNG) || 80.9462,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
  },
  simulationIntervalMs: parseInt(process.env.SIMULATION_INTERVAL_MS, 10) || 30000,
};

module.exports = env;

