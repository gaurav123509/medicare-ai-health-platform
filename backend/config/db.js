const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('[db] MONGODB_URI is missing. Starting server without an active database connection.');
    return { connected: false };
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    mongoose.connection.on('error', (error) => {
      console.error(`[db] MongoDB runtime error: ${error.message}`);
    });

    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
    return { connected: true };
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);

    if (process.env.DB_STRICT_START === 'true') {
      throw error;
    }

    return { connected: false, error };
  }
};

module.exports = connectDB;
