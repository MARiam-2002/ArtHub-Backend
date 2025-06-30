import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connection options optimized for direct testing
const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  minPoolSize: 1,
  bufferCommands: false, // Disable buffering when not connected
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4 // Force IPv4
};

console.log('Starting MongoDB connection test...');

// Check if CONNECTION_URL is defined
if (!process.env.CONNECTION_URL) {
  console.error('❌ ERROR: CONNECTION_URL environment variable is not defined');
  console.log('Please set the CONNECTION_URL environment variable to your MongoDB connection string');
  process.exit(1);
}

// Check if connection string contains placeholders
if (
  process.env.CONNECTION_URL.includes('your_username') ||
  process.env.CONNECTION_URL.includes('your_password') ||
  process.env.CONNECTION_URL.includes('your_cluster')
) {
  console.error('❌ ERROR: CONNECTION_URL contains placeholder values');
  console.log('Please replace the placeholder values with your actual MongoDB credentials');
  process.exit(1);
}

console.log('Connection string format check: OK');
console.log('Attempting to connect to MongoDB...');

// Remove directConnection for SRV URIs
if (process.env.CONNECTION_URL.includes('+srv')) {
  delete options.directConnection;
  console.log('SRV URI detected, removed directConnection option');
}

const startTime = Date.now();

// Try to connect to MongoDB
mongoose.connect(process.env.CONNECTION_URL, options)
  .then(async () => {
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Successfully connected to MongoDB in ${connectionTime}ms`);
    
    // Test basic operations
    try {
      // Get database name
      const dbName = mongoose.connection.db.databaseName;
      console.log(`✅ Connected to database: ${dbName}`);
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`✅ Found ${collections.length} collections`);
      console.log('Collections:', collections.map(c => c.name).join(', '));
      
      // Test admin commands
      try {
        const serverStatus = await mongoose.connection.db.admin().serverStatus();
        console.log(`✅ MongoDB version: ${serverStatus.version}`);
        console.log(`✅ MongoDB connections: ${serverStatus.connections?.current || 'unknown'}`);
      } catch (adminError) {
        console.log('⚠️ Could not get server status (requires admin privileges):', adminError.message);
      }
    } catch (testError) {
      console.error('❌ Error during database operations test:', testError);
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    
    // Provide more helpful error messages based on error type
    if (err.name === 'MongoServerSelectionError') {
      console.error('\n🔍 DIAGNOSIS: Could not reach MongoDB server');
      console.error('Possible causes:');
      console.error('  1. MongoDB connection string is incorrect');
      console.error('  2. MongoDB server is not running or not accessible');
      console.error('  3. Network/firewall is blocking the connection');
      console.error('  4. IP address is not whitelisted in MongoDB Atlas');
    } else if (err.name === 'MongoParseError') {
      console.error('\n🔍 DIAGNOSIS: Invalid MongoDB connection string format');
      console.error('Please check your connection string format');
    } else if (err.message.includes('Authentication failed')) {
      console.error('\n🔍 DIAGNOSIS: Authentication failed');
      console.error('Please check your username and password');
    } else if (err.message.includes('ENOTFOUND')) {
      console.error('\n🔍 DIAGNOSIS: Could not resolve hostname');
      console.error('Please check your MongoDB host address');
    }
    
    process.exit(1);
  }); 