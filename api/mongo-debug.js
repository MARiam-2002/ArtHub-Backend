import mongoose from 'mongoose';
import { connectDB } from '../DB/connection.js';

/**
 * MongoDB connection debug endpoint for Vercel
 * This endpoint helps diagnose MongoDB connection issues
 * @param {import('http').IncomingMessage} req - HTTP request
 * @param {import('http').ServerResponse} res - HTTP response
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      status: 405
    });
  }

  try {
    // Get current connection state
    const currentState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const connectionState = states[currentState] || 'unknown';
    
    // Try to connect if not connected
    let connectionResult = null;
    if (currentState !== 1) {
      try {
        console.log('Attempting to connect to MongoDB...');
        await connectDB();
        connectionResult = {
          success: true,
          message: 'Successfully connected to MongoDB'
        };
      } catch (error) {
        connectionResult = {
          success: false,
          message: 'Failed to connect to MongoDB',
          error: error.message
        };
      }
    }
    
    // Get connection string info (without credentials)
    let connectionInfo = {};
    if (process.env.CONNECTION_URL) {
      try {
        const url = new URL(process.env.CONNECTION_URL);
        connectionInfo = {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
          database: url.pathname.substring(1),
          options: url.search
        };
      } catch (urlError) {
        connectionInfo = { 
          error: "Invalid connection URL format",
          message: urlError.message
        };
      }
    } else {
      connectionInfo = {
        error: "CONNECTION_URL environment variable not set"
      };
    }
    
    // Get MongoDB options from environment variables
    const mongodbOptions = {
      MONGODB_CONNECTION_TIMEOUT: process.env.MONGODB_CONNECTION_TIMEOUT || 'not set',
      MONGODB_SOCKET_TIMEOUT: process.env.MONGODB_SOCKET_TIMEOUT || 'not set',
      MONGODB_SERVER_SELECTION_TIMEOUT: process.env.MONGODB_SERVER_SELECTION_TIMEOUT || 'not set',
      MONGODB_MAX_RETRY_ATTEMPTS: process.env.MONGODB_MAX_RETRY_ATTEMPTS || 'not set',
      MONGODB_BASE_RETRY_DELAY: process.env.MONGODB_BASE_RETRY_DELAY || 'not set'
    };
    
    // Get Vercel environment information
    const vercelInfo = {
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set'
    };
    
    // Try a simple ping if connected
    let pingResult = null;
    if (currentState === 1) {
      try {
        const startTime = Date.now();
        await mongoose.connection.db.admin().ping();
        const endTime = Date.now();
        pingResult = {
          success: true,
          latency: endTime - startTime + 'ms'
        };
      } catch (pingError) {
        pingResult = {
          success: false,
          error: pingError.message
        };
      }
    }

    // Return debug information
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      mongodb: {
        connectionState,
        readyState: currentState,
        connectionResult: connectionResult || 'Already connected',
        connectionInfo,
        ping: pingResult,
        options: mongodbOptions
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        vercel: vercelInfo,
        platform: process.platform,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('MongoDB debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting MongoDB debug information',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 