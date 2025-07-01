import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Direct MongoDB connection test endpoint for Vercel
 * This endpoint attempts a direct connection to MongoDB with minimal configuration
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

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not set'
    },
    connectionTests: {
      mongoose: null,
      nativeDriver: null
    }
  };

  try {
    // Get connection string info (without credentials)
    if (process.env.CONNECTION_URL) {
      try {
        const url = new URL(process.env.CONNECTION_URL);
        results.connectionInfo = {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
          database: url.pathname.substring(1),
          isSrv: url.protocol.includes('srv')
        };
      } catch (urlError) {
        results.connectionInfo = { 
          error: "Invalid connection URL format",
          message: urlError.message
        };
      }
    } else {
      results.connectionInfo = {
        error: "CONNECTION_URL environment variable not set"
      };
      return res.status(500).json({
        success: false,
        message: 'CONNECTION_URL environment variable not set',
        results
      });
    }

    // Test 1: Mongoose connection
    try {
      const startTime = Date.now();
      
      // Only connect if not already connected
      if (mongoose.connection.readyState !== 1) {
        // Set connection options
        const mongooseOptions = {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: 1,
          minPoolSize: 0,
          bufferCommands: false,
          autoIndex: false
        };
        
        await mongoose.connect(process.env.CONNECTION_URL, mongooseOptions);
        
        // Ping to verify connection
        await mongoose.connection.db.admin().ping();
        
        const endTime = Date.now();
        results.connectionTests.mongoose = {
          success: true,
          latency: endTime - startTime + 'ms',
          readyState: mongoose.connection.readyState
        };
        
        // Close connection to avoid keeping it open
        await mongoose.connection.close();
      } else {
        results.connectionTests.mongoose = {
          success: true,
          message: 'Already connected',
          readyState: mongoose.connection.readyState
        };
      }
    } catch (mongooseError) {
      results.connectionTests.mongoose = {
        success: false,
        error: mongooseError.message,
        name: mongooseError.name,
        stack: process.env.NODE_ENV === 'development' ? mongooseError.stack : undefined
      };
    }

    // Test 2: Native MongoDB driver connection
    try {
      const startTime = Date.now();
      
      // Create new client
      const client = new MongoClient(process.env.CONNECTION_URL, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 1,
        minPoolSize: 0
      });
      
      // Connect and ping
      await client.connect();
      await client.db().admin().ping();
      
      const endTime = Date.now();
      results.connectionTests.nativeDriver = {
        success: true,
        latency: endTime - startTime + 'ms'
      };
      
      // Close connection
      await client.close();
    } catch (nativeError) {
      results.connectionTests.nativeDriver = {
        success: false,
        error: nativeError.message,
        name: nativeError.name,
        stack: process.env.NODE_ENV === 'development' ? nativeError.stack : undefined
      };
    }

    // Return results
    const overallSuccess = 
      results.connectionTests.mongoose?.success || 
      results.connectionTests.nativeDriver?.success;
    
    return res.status(overallSuccess ? 200 : 500).json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'At least one connection test succeeded' 
        : 'All connection tests failed',
      results
    });
  } catch (error) {
    console.error('Direct connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running connection tests',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      results
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