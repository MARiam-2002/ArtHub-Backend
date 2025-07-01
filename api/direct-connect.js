import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Direct MongoDB connection test endpoint for Vercel
 * This endpoint attempts a direct connection to MongoDB with minimal configuration
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export default async function handler(req, res) {
  try {
    // Check if we have a connection string
    if (!process.env.CONNECTION_URL) {
      return res.status(500).json({
        success: false,
        message: 'CONNECTION_URL environment variable is not set',
        timestamp: new Date().toISOString()
      });
    }
    
    // Parse connection string to get database info (without exposing credentials)
    let connectionInfo = {};
    try {
      const url = new URL(process.env.CONNECTION_URL);
      connectionInfo = {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
        database: url.pathname.substring(1),
        isSrv: url.protocol.includes('srv'),
        isAtlas: url.hostname.includes('mongodb.net')
      };
    } catch (urlError) {
      return res.status(500).json({
        success: false,
        message: 'Invalid MongoDB connection string format',
        error: urlError.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Closed existing connection');
    }
    
    // Minimal connection options for direct test
    const options = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 1,
      minPoolSize: 0,
      bufferCommands: false,
      autoIndex: false
    };
    
    console.log(`Attempting direct connection to MongoDB at ${connectionInfo.protocol}//${connectionInfo.host}:${connectionInfo.port}/${connectionInfo.database}`);
    
    // Record start time to measure connection speed
    const startTime = Date.now();
    
    // Attempt direct connection
    await mongoose.connect(process.env.CONNECTION_URL, options);
    
    // Calculate connection time
    const connectionTime = Date.now() - startTime;
    
    // Test with a simple ping
    const pingStart = Date.now();
    const pingResult = await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - pingStart;
    
    // Get server info
    const serverStatus = await mongoose.connection.db.admin().serverStatus();
    
    // Test a simple find operation
    const findStart = Date.now();
    const collections = await mongoose.connection.db.listCollections().toArray();
    const findTime = Date.now() - findStart;
    
    // Close the connection
    await mongoose.connection.close();
    
    // Return success with detailed metrics
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to MongoDB',
      connectionInfo,
      metrics: {
        connectionTime: `${connectionTime}ms`,
        pingTime: `${pingTime}ms`,
        findTime: `${findTime}ms`
      },
      serverInfo: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections?.current || 0
      },
      collections: collections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct connection error:', error);
    
    // Return detailed error information
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB',
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      diagnosis: getDiagnosisFromError(error),
      timestamp: new Date().toISOString()
    });
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
  } else if (error.name === 'MongoNetworkError') {
    return {
      issue: 'Network Error',
      possibleCauses: [
        'Network connectivity issues',
        'Firewall blocking connection',
        'MongoDB server not running'
      ],
      recommendations: [
        'Check network connectivity',
        'Verify MongoDB server is running',
        'Check firewall settings'
      ]
    };
  } else {
    return {
      issue: 'Unknown Error',
      possibleCauses: [
        'Connection configuration issue',
        'Server-side problem',
        'Network latency'
      ],
      recommendations: [
        'Check MongoDB Atlas status',
        'Verify environment variables',
        'Try different connection options'
      ]
    };
  }
} 