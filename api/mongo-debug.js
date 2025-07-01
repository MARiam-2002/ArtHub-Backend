import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB connection debug endpoint for Vercel
 * This endpoint helps diagnose MongoDB connection issues
 * @param {import('http').IncomingMessage} req - HTTP request
 * @param {import('http').ServerResponse} res - HTTP response
 */
export default async function handler(req, res) {
  // Set CORS headers for API endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  try {
    // Get current connection state
    const currentState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    // Get connection string info (without exposing credentials)
    let connectionInfo = {};
    if (process.env.CONNECTION_URL) {
      try {
        const url = new URL(process.env.CONNECTION_URL);
        connectionInfo = {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
          database: url.pathname.substring(1),
          options: Object.fromEntries(url.searchParams),
          isSrv: url.protocol.includes('srv'),
          isAtlas: url.hostname.includes('mongodb.net')
        };
      } catch (urlError) {
        connectionInfo = { 
          error: "Invalid connection URL format",
          message: urlError.message
        };
      }
    } else {
      connectionInfo = {
        error: "CONNECTION_URL environment variable is not set"
      };
    }
    
    // Get environment variables (excluding sensitive ones)
    const envVars = Object.keys(process.env)
      .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('TOKEN'))
      .reduce((obj, key) => {
        if (key === 'CONNECTION_URL') {
          obj[key] = 'REDACTED';
        } else {
          obj[key] = process.env[key];
        }
        return obj;
      }, {});
    
    // Return diagnostic information
    res.status(200).json({
      timestamp: new Date().toISOString(),
      mongooseState: {
        readyState: currentState,
        status: states[currentState] || 'unknown'
      },
      connectionInfo,
      environment: {
        node: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
        serverless: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION || 'unknown',
        memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        timeout: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT
      },
      timeoutSettings: {
        serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT || 'default',
        socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT || 'default',
        connectTimeoutMS: process.env.MONGODB_CONNECTION_TIMEOUT || 'default'
      },
      envVars
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 