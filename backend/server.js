const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Setup CORS with flexible origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup Request body size parsers (increase limit for image/embedding base64 arrays)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve profile uploads statically so images are displayable in browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root diagnostic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    status: 'online', 
    service: 'AI Attendance Platform', 
    timestamp: new Date() 
  });
});

// Import modular routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Bind router middleware
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Catch-all invalid route middleware
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Global central error handler middleware
app.use((err, req, res, next) => {
  console.error('🔥 Global Exception Intercepted:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Boot listening socket
app.listen(PORT, () => {
  console.log(`🚀 Express Application running on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`📂 Serving static uploads from: ${path.join(__dirname, 'uploads')}`);
});
