import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database test endpoint for Vercel
 * This endpoint tests the MongoDB connection and returns detailed diagnostics
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export default async function handler(req, res) {
  // Only allow this endpoint in development or with special auth header
  const isAuthorized = 
    process.env.NODE_ENV !== 'production' || 
    req.headers['x-db-test-key'] === process.env.DB_TEST_KEY;
  
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access to database test endpoint'
    });
  }
  
  try {
    // Check if we have a connection string
    if (!process.env.CONNECTION_URL) {
      return res.status(500).json({
        success: false,
        message: 'CONNECTION_URL environment variable is not set',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if connection string contains placeholders
    if (process.env.CONNECTION_URL.includes('your_username') || 
        process.env.CONNECTION_URL.includes('your_password') || 
        process.env.CONNECTION_URL.includes('your_cluster')) {
      return res.status(500).json({
        success: false,
        message: 'CONNECTION_URL contains placeholder values',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get current connection state
    const currentState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const currentStateText = states[currentState] || 'unknown';
    
    // If already connected, return status
    if (currentState === 1) {
      return res.status(200).json({
        success: true,
        message: 'Already connected to MongoDB',
        connectionState: currentStateText,
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to connect
    console.log('Testing MongoDB connection...');
    const startTime = Date.now();
    
    // Connection options optimized for test
    const options = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      family: 4
    };
    
    // Connect to MongoDB
    await mongoose.connect(process.env.CONNECTION_URL, options);
    
    // Calculate connection time
    const connectionTime = Date.now() - startTime;
    
    // Get server info
    let serverInfo = {};
    try {
      const admin = mongoose.connection.db.admin();
      const serverStatus = await admin.serverStatus();
      serverInfo = {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections?.current || 0
      };
    } catch (infoError) {
      console.error('Error getting server info:', infoError);
      serverInfo = { error: infoError.message };
    }
    
    // Close connection if it was established just for this test
    if (currentState !== 1) {
      await mongoose.connection.close();
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      connectionTime: `${connectionTime}ms`,
      serverInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    // Return detailed error information
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error.message,
      errorCode: error.name,
      timestamp: new Date().toISOString()
    });
  }
} 