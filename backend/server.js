const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const symptomRoutes = require('./routes/symptom.routes');
const medicineRoutes = require('./routes/medicine.routes');
const reportRoutes = require('./routes/report.routes');
const reminderRoutes = require('./routes/reminder.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const diseaseRoutes = require('./routes/disease.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/response');

const app = express();
const port = Number(process.env.PORT) || 5000;
const uploadDirectories = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'reports'),
  path.join(__dirname, 'uploads', 'medicines'),
];

uploadDirectories.forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((entry) => entry.trim()).filter(Boolean)
  : [];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'Backend is running', {
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/symptom', symptomRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/appointment', appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

let server;

const startServer = async () => {
  await connectDB();

  await new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`[server] MediCare AI backend running on port ${port}`);
      resolve();
    });

    server.on('error', reject);
  });
};

const shutdown = async (signal) => {
  console.log(`[server] Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } else {
    await mongoose.connection.close();
    process.exit(0);
  }
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

startServer().catch((error) => {
  console.error(`[server] Startup failed: ${error.message}`);
  process.exit(1);
});

module.exports = app;
