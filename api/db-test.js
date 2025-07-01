import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database test endpoint for Vercel
 * This endpoint tests the MongoDB connection and returns detailed diagnostics
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
  
  // Only allow this endpoint in development or with special auth header
  const isAuthorized = 
    process.env.NODE_ENV !== 'production' || 
    req.headers['x-db-test-key'] === process.env.DB_TEST_KEY ||
    req.query.key === process.env.DB_TEST_KEY;
  
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
        timestamp: new Date().toISOString(),
        env_vars: Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('SECRET')).join(', ')
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
    
    // Get connection string info (without exposing credentials)
    const connectionInfo = getConnectionInfo(process.env.CONNECTION_URL);
    
    // If already connected, return status
    if (currentState === 1) {
      return res.status(200).json({
        success: true,
        message: 'Already connected to MongoDB',
        connectionState: currentStateText,
        connectionInfo,
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to connect
    console.log('Testing MongoDB connection...');
    const startTime = Date.now();
    
    // Connection options optimized for test
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased from 5000
      connectTimeoutMS: 10000, // Increased from 5000
      socketTimeoutMS: 15000, // Increased from 10000
      maxPoolSize: 1,
      bufferCommands: false,
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
    
    // Try a simple find operation to test query performance
    let queryInfo = {};
    try {
      const queryStartTime = Date.now();
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      if (collections.length > 0) {
        const firstCollection = collections[0].name;
        const queryResult = await mongoose.connection.db.collection(firstCollection)
          .find({})
          .limit(1)
          .maxTimeMS(5000) // Increased from 2000
          .toArray();
        
        queryInfo = {
          success: true,
          collection: firstCollection,
          time: `${Date.now() - queryStartTime}ms`,
          found: queryResult.length > 0
        };
      } else {
        queryInfo = {
          success: true,
          message: 'No collections found to test query'
        };
      }
    } catch (queryError) {
      queryInfo = {
        success: false,
        error: queryError.message
      };
    }
    
    // Close connection if it was established just for this test
    if (currentState !== 1) {
      await mongoose.connection.close();
    }
    
    // Return success response with detailed diagnostics
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      connectionTime: `${connectionTime}ms`,
      connectionInfo,
      serverInfo,
      queryInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        vercel: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    // Get connection string info (without exposing credentials)
    const connectionInfo = getConnectionInfo(process.env.CONNECTION_URL);
    
    // Return detailed error information
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error.message,
      errorCode: error.name,
      connectionInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        vercel: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION || 'unknown'
      },
      diagnosis: getDiagnosisFromError(error),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Extract connection info from MongoDB connection string without exposing credentials
 * @param {string} connectionString - MongoDB connection string
 * @returns {Object} - Connection info
 */
function getConnectionInfo(connectionString) {
  try {
    if (!connectionString) return { error: 'Connection string is empty' };
    
    // Parse the connection string
    const url = new URL(connectionString);
    
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port || 'default',
      database: url.pathname.substring(1) || 'none specified',
      options: Object.fromEntries(url.searchParams),
      isAtlas: url.hostname.includes('mongodb.net'),
      isSrv: url.protocol.includes('srv')
    };
  } catch (error) {
    return { 
      error: 'Invalid connection string format',
      details: error.message
    };
  }
}

/**
 * Get diagnosis from MongoDB error
 * @param {Error} error - MongoDB error
 * @returns {Object} - Diagnosis
 */
function getDiagnosisFromError(error) {
  if (error.name === 'MongoServerSelectionError') {
    return {
      issue: 'Server Selection Error',
      possibleCauses: [
        'MongoDB server is not running or not accessible',
        'Network/firewall is blocking the connection',
        'IP address is not whitelisted in MongoDB Atlas',
        'DNS resolution issues'
      ],
      recommendations: [
        'Check if MongoDB Atlas cluster is running',
        'Add 0.0.0.0/0 to IP whitelist in MongoDB Atlas',
        'Verify connection string is correct',
        'Try increasing serverSelectionTimeoutMS'
      ]
    };
  } else if (error.name === 'MongoParseError') {
    return {
      issue: 'Connection String Parse Error',
      possibleCauses: [
        'Invalid MongoDB connection string format',
        'Missing required parts in connection string'
      ],
      recommendations: [
        'Check connection string format',
        'Ensure all required parts are present'
      ]
    };
  } else if (error.message.includes('Authentication failed')) {
    return {
      issue: 'Authentication Error',
      possibleCauses: [
        'Incorrect username or password',
        'User does not have access to the database',
        'Special characters in password not properly URL encoded'
      ],
      recommendations: [
        'Verify username and password',
        'Check user permissions in MongoDB Atlas',
        'URL encode special characters in password'
      ]
    };
  } else {
    return {
      issue: 'Unknown Error',
      possibleCauses: [
        'Connection configuration issue',
        'Server-side problem',
        'Network latency or timeout'
      ],
      recommendations: [
        'Check MongoDB Atlas status',
        'Verify environment variables',
        'Try increasing timeout values'
      ]
    };
  }
} 