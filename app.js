const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const errorHandler = require('./src/middleware/errorHandler.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);         
app.use('/api', protectedRoutes);    
app.use('/api', dashboardRoutes);    

// Existing routes (can keep them for backward compatibility or replace)
// Requirement 5 specified specific paths /api/upload-timetable and /api/faculty-data
// which are covered by protectedRoutes under the /api prefix.

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling - must be last
app.use(errorHandler);

module.exports = app;
