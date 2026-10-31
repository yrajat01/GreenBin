const mongoose = require("mongoose");

// Connection to MongoDB
const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/greenbin";

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}`);
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
    console.warn('⚠️  MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully.');
  });
};

module.exports = connectDB;
