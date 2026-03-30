require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const publicRoutes = require('./routes/publicRoutes');

connectDB();

// Initialize CRON jobs
require('./utils/cronService');

const app = express();

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    if (res.statusCode >= 400) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  });
  next();
});

// Middlewares
app.use(cors("*"));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/public', publicRoutes);
app.get('/api/ping', (req, res) => res.json({ status: 'alive' }));

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to Code a Nova API",
    status: "Running",
    vercel: true
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log the complete error for Vercel Console
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Useful if the user wants stack in dev
  });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Local Access: http://localhost:${PORT}`);
});