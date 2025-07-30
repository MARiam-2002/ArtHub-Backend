import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArtHub Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running properly',
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes placeholder
app.get('/api/auth/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth endpoint placeholder',
    path: req.path
  });
});

app.get('/api/user/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User endpoint placeholder',
    path: req.path
  });
});

app.get('/api/artworks/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Artworks endpoint placeholder',
    path: req.path
  });
});

app.get('/api/admin/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin endpoint placeholder',
    path: req.path
  });
});

app.get('/api/dashboard/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard endpoint placeholder',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📡 API Health: http://localhost:${port}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${port} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app; 