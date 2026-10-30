require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const validateEnvironment = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const rejectMongoOperators = require('./middleware/rejectMongoOperators');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(rejectMongoOperators);

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? 'iMovies API and database are ready.' : 'iMovies database is unavailable.',
    database: databaseReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to iMovies API' });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is not ready. Please retry shortly.',
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorMiddleware);

let server;
let shuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`Graceful shutdown failed (${error.name || 'unknown error'}).`);
    process.exit(1);
  }
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

const startServer = async () => {
  try {
    const { port } = validateEnvironment();
    console.log('Connecting to configured MongoDB Atlas cluster...');
    await connectDB();
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Backend server is listening on port ${port}.`);
    });
  } catch (error) {
    console.error('Server failed to start. Check backend/.env and MongoDB Atlas network access.');
    if (/^(Missing MONGO_URI|MONGO_URI must|MONGO_URI still|JWT_SECRET must|PORT must|JWT_EXPIRES_IN must)/.test(error.message)) {
      console.error(error.message);
    }
    console.error(`Startup error type: ${error.name || 'unknown error'}`);
    process.exitCode = 1;
  }
};

if (require.main === module) startServer();

module.exports = { app, startServer };
