import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Conditional import for development/testing only
let MongoMemoryServer;
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  try {
    const { MongoMemoryServer: MMS } = await import('mongodb-memory-server');
    MongoMemoryServer = MMS;
  } catch (error) {
    console.warn('⚠️ mongodb-memory-server not available, skipping in-memory database setup');
    MongoMemoryServer = null;
  }
}

// Variables for connection management
let mongoServer;
const isServerlessEnv = () =>
  !!process.env.VERCEL || !!process.env.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// On Vercel Hobby, total budget is ~10s — keep connect attempts short
const MAX_RETRIES = parseInt(
  process.env.MONGODB_MAX_RETRY_ATTEMPTS || (isServerlessEnv() ? '1' : '5')
);
const RETRY_INTERVAL = parseInt(
  process.env.MONGODB_BASE_RETRY_DELAY || (isServerlessEnv() ? '500' : '3000')
);

// Global connection cache - critical for serverless
let cachedConnection = null;
let isConnecting = false;
let connectionPromise = null;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN = 1000; // 1 second between connection attempts

/**
 * Normalize CONNECTION_URL from env (strip quotes/whitespace that break Vercel envs)
 */
export const getConnectionUrl = () => {
  let url = process.env.CONNECTION_URL || process.env.MONGODB_URI || '';
  url = String(url).trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  // Common paste issue: literal \n at end
  url = url.replace(/\\n$/g, '').trim();
  return url;
};

// Serverless-optimized connection options
const getConnectionOptions = (isServerless = false) => {
  const baseOptions = {
    serverSelectionTimeoutMS: parseInt(
      process.env.MONGODB_SERVER_SELECTION_TIMEOUT || (isServerless ? '5000' : '20000')
    ),
    socketTimeoutMS: parseInt(
      process.env.MONGODB_SOCKET_TIMEOUT || (isServerless ? '10000' : '60000')
    ),
    connectTimeoutMS: parseInt(
      process.env.MONGODB_CONNECTION_TIMEOUT || (isServerless ? '5000' : '20000')
    ),
    maxPoolSize: isServerless ? 1 : 10,
    minPoolSize: isServerless ? 0 : 2,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false,
    autoIndex: false,
    family: 4,
    heartbeatFrequencyMS: isServerless ? 30000 : 10000
  };

  if (isServerless) {
    baseOptions.maxIdleTimeMS = 10000;
    baseOptions.retryWrites = true;
    baseOptions.retryReads = true;

    const connectionUrl = getConnectionUrl();
    if (connectionUrl && !connectionUrl.includes('+srv')) {
      baseOptions.directConnection = true;
    }
  }

  return baseOptions;
};

/**
 * Connect to MongoDB with optimized settings for serverless environments
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
export const connectDB = async (retryCount = 0) => {
  // Implement connection throttling to prevent connection storms
  const now = Date.now();
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    console.log('⏱️ Connection attempt throttled, waiting for cooldown');
    await new Promise(resolve => setTimeout(resolve, CONNECTION_COOLDOWN));
  }
  lastConnectionAttempt = Date.now();

  // If already connecting, return the existing promise to prevent multiple connection attempts
  if (isConnecting && connectionPromise) {
    console.log('🔄 Already attempting to connect, reusing connection promise');
    return connectionPromise;
  }

  // If we already have a valid connection, return it immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    try {
      // Verify connection with a quick ping
      await mongoose.connection.db.admin().ping();
      console.log('✅ Using cached MongoDB connection');
      return cachedConnection;
    } catch (pingError) {
      console.log('⚠️ Cached connection failed ping check, will reconnect');
      // Connection is stale, continue to reconnect
      cachedConnection = null;
    }
  }

  // Set connecting flag and create a new connection promise
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        try {
          // Verify with ping
          await mongoose.connection.db.admin().ping();
          console.log('✅ Mongoose already connected');
          cachedConnection = mongoose.connection;
          return mongoose.connection;
        } catch (pingError) {
          console.log('⚠️ Existing connection failed ping check, will reconnect');
          // Force close the stale connection
          try {
            await mongoose.connection.close();
          } catch (closeError) {
            console.error('⚠️ Error closing stale connection:', closeError.message);
          }
        }
      }

      // Different connection approach based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production environment: use CONNECTION_URL from environment variables
        const connectionUrl = getConnectionUrl();
        if (!connectionUrl) {
          console.error('❌ Missing CONNECTION_URL environment variable in production');
          throw new Error('Missing CONNECTION_URL in production');
        }

        // Keep process.env in sync with sanitized value
        process.env.CONNECTION_URL = connectionUrl;

        // Check if connection string contains placeholders
        if (
          connectionUrl.includes('your_username') ||
          connectionUrl.includes('your_password') ||
          connectionUrl.includes('your_cluster')
        ) {
          console.error('⚠️ MongoDB connection string contains placeholder values');
          throw new Error('MongoDB connection string contains placeholders');
        }

        console.log('🔄 Connecting to production MongoDB...');

        // Detect serverless environment
        const isServerless = isServerlessEnv();
        if (isServerless) {
          console.log('🚀 Running in serverless environment, using optimized settings');
        }

        // Get appropriate connection options
        const options = getConnectionOptions(isServerless);

        // Connect with optimized settings and exponential backoff
        let lastError = null;
        let backoffTime = RETRY_INTERVAL;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`🔄 Connection attempt ${attempt} of ${MAX_RETRIES}...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              backoffTime = Math.min(backoffTime * 1.5, isServerless ? 1000 : backoffTime * 1.5);
            }

            // For Vercel, add a special flag to help with debugging
            if (isServerless) {
              const hostPart = connectionUrl.includes('@')
                ? connectionUrl.split('@').pop()?.split('/')[0]
                : '(unparseable host)';
              console.log(`🔄 Connecting to MongoDB host: ${hostPart}`);
            }

            await mongoose.connect(connectionUrl, options);
            break; // Connection successful, exit the loop
          } catch (err) {
            lastError = err;
            console.error(`❌ Connection attempt ${attempt + 1} failed:`, err.message);

            // If this was the last attempt, throw the error
            if (attempt === MAX_RETRIES) {
              throw err;
            }
          }
        }
      } else {
        // Development environment: use in-memory MongoDB if no CONNECTION_URL
        if (!process.env.CONNECTION_URL) {
          if (MongoMemoryServer) {
            console.log('🧪 No CONNECTION_URL provided, using in-memory MongoDB instance');

            // Create in-memory database if not exists
            if (!mongoServer) {
              mongoServer = await MongoMemoryServer.create();
              const mongoUri = mongoServer.getUri();
              console.log(`🧪 In-memory MongoDB server started at ${mongoUri}`);
              process.env.CONNECTION_URL = mongoUri;
            }

            // Connect to in-memory database with appropriate options
            await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
          } else {
            console.error('❌ No CONNECTION_URL provided and mongodb-memory-server not available');
            console.error('Please set CONNECTION_URL environment variable or install mongodb-memory-server for development');
            throw new Error('Database connection failed: No CONNECTION_URL and no in-memory server available');
          }
        } else {
          // Try to connect with the provided URL
          try {
            console.log('🔄 Connecting to development MongoDB with provided URL...');
            await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
          } catch (connectionError) {
            // If connection fails, fall back to in-memory database (if available)
            if (MongoMemoryServer) {
              console.log(
                '⚠️ Connection to provided MongoDB URL failed, falling back to in-memory database'
              );

              if (!mongoServer) {
                mongoServer = await MongoMemoryServer.create();
                const mongoUri = mongoServer.getUri();
                console.log(`🧪 In-memory MongoDB server started at ${mongoUri}`);
                process.env.CONNECTION_URL = mongoUri;
              }

              // Connect to in-memory database
              await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
            } else {
              console.error('❌ Connection to provided MongoDB URL failed and no fallback available');
              throw connectionError;
            }
          }
        }
      }

      console.log('✅ MongoDB connected successfully!');

      // Set up connection event listeners for better error handling
      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err);
        // Reset cache if connection fails after initial success
        if (cachedConnection) {
          cachedConnection = null;
        }
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        // Reset cache on disconnect
        cachedConnection = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        // Update cache on reconnect
        cachedConnection = mongoose.connection;
      });

      // Cache the connection
      cachedConnection = mongoose.connection;
      return cachedConnection;
    } catch (error) {
      console.error('❌ Database connection error:', error.message);

      // Enhanced error messaging based on error type
      if (error.name === 'MongoServerSelectionError') {
        console.error('⚠️ Could not connect to MongoDB server. Please check:');
        console.error('  - MongoDB server is running and accessible');
        console.error('  - Connection URL is correct (username, password, cluster name)');
        console.error('  - Network allows connection to MongoDB (firewall/security groups)');
        console.error(
          "  - MongoDB Atlas IP whitelist includes your server's IP (add 0.0.0.0/0 for testing)"
        );

        // Check if this is a Vercel deployment
        if (process.env.VERCEL || process.env.VERCEL_ENV) {
          console.error(
            '⚠️ IMPORTANT: For Vercel deployments, you MUST add 0.0.0.0/0 to your MongoDB Atlas IP whitelist'
          );
          console.error('  - Vercel uses dynamic IPs for serverless functions');
          console.error('  - Go to MongoDB Atlas > Network Access and add 0.0.0.0/0');
        }
      } else if (error.name === 'MongoParseError') {
        console.error('⚠️ Invalid MongoDB connection string format');
      } else if (error.message.includes('Authentication failed')) {
        console.error('⚠️ MongoDB authentication failed. Check username and password');
      } else if (error.message.includes('ENOTFOUND')) {
        console.error('⚠️ Could not resolve MongoDB host. Check cluster address');
      } else if (error.message.includes('buffering timed out')) {
        console.error('⚠️ MongoDB operation buffering timed out. This typically happens when:');
        console.error('  - The connection to MongoDB is unstable or has high latency');
        console.error('  - The MongoDB server is under heavy load');
        console.error("  - The IP whitelist in MongoDB Atlas doesn't include your server's IP");

        if (process.env.VERCEL || process.env.VERCEL_ENV) {
          console.error(
            '⚠️ For Vercel deployments, this is often caused by IP whitelist restrictions'
          );
          console.error('  - Add 0.0.0.0/0 to your MongoDB Atlas IP whitelist');
        }
      }

      // Implement retry mechanism with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffTime = RETRY_INTERVAL * Math.pow(1.5, retryCount);
        console.log(
          `🔄 Retrying connection in ${backoffTime / 1000} seconds... (Attempt ${retryCount + 1} of ${MAX_RETRIES})`
        );
        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // Reset flags for retry
        isConnecting = false;
        connectionPromise = null;

        // Try again with incremented retry count
        return connectDB(retryCount + 1);
      }

      // After all retries, handle based on environment
      if (process.env.NODE_ENV === 'production') {
        // In production, reject with error
        throw error;
      } else {
        // In development, provide more detailed error information
        console.error(
          '💡 Check if your MongoDB connection string is correct or use in-memory database'
        );
        throw error;
      }
    } finally {
      // Reset connecting flag
      isConnecting = false;
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

/**
 * Check if database connection is alive and reconnect if needed
 * @returns {Promise<boolean>} Connection status
 */
export const checkDatabaseConnection = async () => {
  try {
    // If no connection exists, try to connect
    if (!cachedConnection || mongoose.connection.readyState !== 1) {
      console.log('🔄 No active connection, attempting to connect...');
      await connectDB();
      return mongoose.connection.readyState === 1;
    }

    // Verify connection with a simple ping with timeout
    try {
      // Use a promise with timeout for the ping
      const pingPromise = mongoose.connection.db.admin().ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Ping timeout')), 2000);
      });

      // Race the ping against the timeout
      await Promise.race([pingPromise, timeoutPromise]);
      return true;
    } catch (pingError) {
      console.error('❌ Database ping failed:', pingError.message);

      // If ping fails, the connection might be stale
      console.log('🔄 Ping failed, attempting to reconnect...');

      // Close the existing connection first
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        console.error('⚠️ Error closing stale connection:', closeError.message);
      }

      // Reset cache
      cachedConnection = null;

      // Try to reconnect
      await connectDB();

      // Verify the new connection
      return mongoose.connection.readyState === 1;
    }
  } catch (error) {
    console.error('❌ Database connection check failed:', error.message);

    // Reset cache on failed check
    cachedConnection = null;

    // Try to reconnect once with a fresh connection
    try {
      // Force a fresh connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      await connectDB();
      return mongoose.connection.readyState === 1;
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError.message);
      return false;
    }
  }
};

/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
export const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // Check if connection is active
      if (mongoServer && MongoMemoryServer) {
        try {
          await mongoose.connection.dropDatabase();
          await mongoose.connection.close();
          await mongoServer.stop();
          mongoServer = null;
          console.log('✅ In-memory MongoDB server stopped successfully');
        } catch (mongoError) {
          console.warn('⚠️ Error stopping in-memory MongoDB server:', mongoError.message);
          // Still try to close the mongoose connection
          await mongoose.connection.close();
        }
      } else {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed successfully');
      }
      cachedConnection = null;
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};
