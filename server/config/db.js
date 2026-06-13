const mongoose = require('mongoose');
const logger = require('../utils/logger');

let dbConnected = false;

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    logger.warn("⚠️ MONGODB_URI not specified. Running in standalone IN-MEMORY fallback mode.");
    dbConnected = false;
    return false;
  }

  try {
    logger.info("🔌 Connecting to MongoDB...");
    // Set connection timeouts so we don't hang indefinitely on startup if DB is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    dbConnected = true;
    logger.info("✅ MongoDB connected successfully!");
    return true;
  } catch (error) {
    logger.error("❌ MongoDB connection failed: ", error);
    logger.warn("⚠️ Falling back to IN-MEMORY storage mode. Changes will not persist after server restart.");
    dbConnected = false;
    return false;
  }
}

function isConnected() {
  return dbConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isConnected,
  get dbConnected() {
    return isConnected();
  }
};
