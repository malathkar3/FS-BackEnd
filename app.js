const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./src/routes/upload.route');
const facultyRoutes = require('./src/routes/faculty.route');
const errorHandler = require('./src/middleware/errorHandler.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload-timetable', uploadRoutes);
app.use('/api/faculty', facultyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling - must be last
app.use(errorHandler);

module.exports = app;
