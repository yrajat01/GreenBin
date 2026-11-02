const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with auto-reconnection and diagnostic logging
 */
const connectDB = async () => {
  const mongoUri = env.mongoUri;

  try {
    const sanitizedUri = mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@');
    logger.info(`Connecting to MongoDB at: ${sanitizedUri}`);
    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`\n❌ MongoDB Connection Error: ${error.message}`);
    console.error(`================================================================`);
    console.error(`  GreenBin backend could not connect to MongoDB.`);
    console.error(`  To get MongoDB running:`);
    console.error(`  1. (Docker): Run 'docker compose up -d' in the project root.`);
    console.error(`  2. (Local):  Start your local MongoDB service (e.g. 'mongod').`);
    console.error(`  3. (Atlas):  Set MONGODB_URI in server/.env to your Atlas connection string.`);
    console.error(`================================================================\n`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('✅ MongoDB reconnected successfully.');
  });
};

module.exports = connectDB;
