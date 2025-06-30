# MongoDB Connection Troubleshooting Guide

## Common MongoDB Connection Issues

### 1. Operation Buffering Timed Out

**Error Message:**
```
MongooseError: Operation `users.findOne()` buffering timed out after 1000ms
```

**Causes:**
- MongoDB server is unreachable
- Connection string is incorrect
- Network issues preventing connection
- MongoDB Atlas IP whitelist restrictions

**Solutions:**
1. **Check your CONNECTION_URL environment variable**
   - Ensure the username, password, and cluster name are correct
   - Make sure there are no typos or special characters that need URL encoding

2. **Increase timeout settings**
   - In `DB/connection.js`, increase the following settings:
     ```javascript
     {
       serverSelectionTimeoutMS: 10000,
       socketTimeoutMS: 45000,
       connectTimeoutMS: 10000,
       bufferTimeoutMS: 30000
     }
     ```

3. **Check MongoDB Atlas whitelist**
   - Ensure your IP address or 0.0.0.0/0 is in the IP Access List
   - For Vercel deployments, you must allow access from all IPs (0.0.0.0/0)

### 2. Service Unavailable (503) on Vercel

**Error Message:**
```json
{
  "success": false,
  "status": 503,
  "message": "الخدمة غير متوفرة",
  "error": "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا",
  "errorCode": "ERROR_503",
  "timestamp": "2025-06-30T21:27:01.488Z"
}
```

**Causes:**
- Serverless cold starts causing connection timeouts
- MongoDB connection not optimized for serverless environments
- Missing or incorrect environment variables in Vercel

**Solutions:**
1. **Update Vercel configuration**
   - Add the following to your `vercel.json` file:
     ```json
     "functions": {
       "index.js": {
         "memory": 1024,
         "maxDuration": 10
       }
     }
     ```

2. **Optimize MongoDB connection for serverless**
   - Use connection pooling with lower values for serverless:
     ```javascript
     {
       maxPoolSize: 5,
       minPoolSize: 1,
       serverSelectionTimeoutMS: 5000,
       socketTimeoutMS: 30000,
       connectTimeoutMS: 5000
     }
     ```

3. **Implement connection caching**
   - Cache the MongoDB connection between function invocations
   - Add a connection check middleware for each API request

4. **Set up proper environment variables in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add your MongoDB connection string as CONNECTION_URL
   - Make sure to use the correct format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 3. Authentication Failed

**Error Message:**
```
MongoServerError: Authentication failed
```

**Causes:**
- Incorrect username or password in connection string
- Special characters in password not properly URL encoded
- User doesn't have access to the specified database

**Solutions:**
1. **Check credentials**
   - Verify username and password are correct
   - URL encode special characters in your password

2. **Check database permissions**
   - Ensure the user has appropriate roles for the database
   - In MongoDB Atlas, check Database Access settings

### 4. Connection Timeout in Production

**Error Message:**
```
MongoServerSelectionError: connection timed out
```

**Causes:**
- Network latency between your server and MongoDB
- Firewall or security group restrictions
- MongoDB server under heavy load

**Solutions:**
1. **Check network connectivity**
   - Ensure your hosting provider can reach MongoDB Atlas
   - Test with a simple connection script

2. **Adjust timeout settings**
   - Increase serverSelectionTimeoutMS and connectTimeoutMS
   - Add connection retry logic

3. **Check MongoDB Atlas status**
   - Visit MongoDB Atlas status page for any ongoing issues

## Vercel Deployment Specific Issues

### 1. Cold Start Connection Problems

**Symptoms:**
- First request after inactivity fails with 503 error
- Subsequent requests work normally

**Solutions:**
1. **Implement connection caching**
   - Store the mongoose connection in a variable outside the serverless function
   - Check and reuse the connection on each request

2. **Use connection pooling optimized for serverless**
   - Lower maxPoolSize (5 is recommended)
   - Set minPoolSize to 1
   - Enable directConnection option for Vercel

3. **Add keep-alive mechanism**
   - Set up a scheduled task to ping your API every 5 minutes
   - This prevents cold starts by keeping the function warm

### 2. Environment Variables Not Working

**Symptoms:**
- Connection fails even with correct configuration
- Logs show "Missing CONNECTION_URL" error

**Solutions:**
1. **Check Vercel dashboard**
   - Verify environment variables are set correctly
   - Environment variables are case-sensitive

2. **Use Vercel CLI to debug**
   - Run `vercel env ls` to list environment variables
   - Add missing variables with `vercel env add`

3. **Check for placeholder values**
   - Make sure you've replaced placeholder values in vercel.json
   - The connection.js file checks for placeholders like "your_username"

### 3. Vercel Function Timeout Issues

**Symptoms:**
- Requests taking longer than 10 seconds fail with 504 Gateway Timeout
- Database operations time out during peak load

**Solutions:**
1. **Increase function timeout**
   - Update `vercel.json` with:
     ```json
     "functions": {
       "index.js": {
         "maxDuration": 30
       }
     }
     ```

2. **Optimize database queries**
   - Add proper indexes to MongoDB collections
   - Use projection to limit returned fields
   - Implement pagination for large result sets

3. **Use serverless-friendly connection settings**
   - Set `directConnection: true` for more reliable connections
   - Use `bufferCommands: true` with reasonable timeout
   - Implement connection pooling with small pool size

### 4. Keeping Connections Alive

**Symptoms:**
- Frequent reconnections causing performance degradation
- Inconsistent connection behavior

**Solutions:**
1. **Create a keep-alive endpoint**
   - Add a simple endpoint that checks database connection
   - Use an external service to ping this endpoint every 5 minutes

2. **Implement connection events**
   - Listen for disconnection events and reconnect automatically
   - Log connection state changes for debugging

3. **Use a connection manager**
   - Implement a singleton connection manager
   - Track connection state and handle reconnection logic

## Best Practices for MongoDB in Serverless

1. **Connection pooling**
   - Use appropriate pool sizes for serverless (smaller is better)
   - Set minPoolSize to ensure at least one connection is maintained

2. **Connection caching**
   - Store and reuse database connections between invocations
   - Check connection state before reusing

3. **Error handling**
   - Implement robust error handling and retry mechanisms
   - Return user-friendly error messages

4. **Monitoring**
   - Set up monitoring for database connection issues
   - Use MongoDB Atlas monitoring tools

5. **Performance optimization**
   - Create appropriate indexes for your queries
   - Use MongoDB Atlas performance advisor

By following these troubleshooting steps and best practices, you should be able to resolve most MongoDB connection issues in both development and production environments.

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```
CONNECTION_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
TOKEN_KEY=your_jwt_secret_key
SALT_ROUND=10
```

Replace `<username>`, `<password>`, `<cluster>`, and `<dbname>` with your MongoDB Atlas credentials.

## Testing Your Connection

You can test your MongoDB connection using the following command:

```javascript
// Run this in a Node.js REPL or script
const mongoose = require('mongoose');
mongoose.connect('your_connection_string')
  .then(() => console.log('Connected successfully'))
  .catch(err => console.error('Connection failed:', err));
```

## Production Deployment Notes

For production deployments:

1. **Use environment variables** - Never hardcode connection strings
2. **Set appropriate timeouts** - Balance between quick failure detection and tolerance for network hiccups
3. **Implement connection pooling** - Set `maxPoolSize` according to your application's needs
4. **Enable SSL** - Always use SSL for MongoDB connections in production
5. **Monitor connections** - Use MongoDB Atlas monitoring or implement your own connection monitoring

## Need Further Help?

If you're still experiencing issues:

1. Check MongoDB Atlas status page: https://status.mongodb.com/
2. Review MongoDB connection documentation: https://docs.mongodb.com/drivers/node/current/fundamentals/connection/
3. Contact MongoDB Atlas support if you're using their cloud service

# MongoDB Troubleshooting Guide for Vercel Deployment

## Common MongoDB Connection Issues in Serverless Environments

When deploying a MongoDB-backed application on Vercel or other serverless platforms, you may encounter specific connection issues that don't typically occur in traditional server environments. This guide will help you diagnose and resolve these issues.

## Identifying the Problem

### Common Error Messages

1. **Operation `collection.findOne()` buffering timed out after 10000ms**
   - This occurs when MongoDB operations are queued (buffered) while waiting for a connection, but the connection isn't established within the timeout period.

2. **MongoServerSelectionError: connection timed out**
   - MongoDB driver couldn't select a server to connect to within the specified timeout.

3. **MongoNetworkError: failed to connect to server**
   - Network-level connection failure, often due to firewall rules or incorrect connection string.

4. **MongooseServerSelectionError: getaddrinfo ENOTFOUND**
   - DNS resolution failure - the MongoDB host cannot be found.

### Diagnosis Steps

1. **Check the connection status**:
   - Visit `/api/db-test` endpoint with your DB_TEST_KEY to get detailed diagnostics
   - Example: `https://your-app.vercel.app/api/db-test?key=your_db_test_key`

2. **Verify environment variables**:
   - Ensure `CONNECTION_URL` is properly set in Vercel's environment variables
   - Check for any special characters that might need URL encoding

3. **Check MongoDB Atlas settings**:
   - IP access list (whitelist)
   - User permissions
   - Cluster status

## Common Solutions

### 1. MongoDB Atlas IP Whitelist

The most common issue is IP whitelisting. Vercel functions run on dynamic IPs that change between invocations.

**Solution**: Add `0.0.0.0/0` (allow access from anywhere) to your MongoDB Atlas IP Access List.

1. Log in to MongoDB Atlas
2. Go to Network Access under Security
3. Add `0.0.0.0/0` to the IP Access List
4. Save changes

### 2. Connection String Configuration

Optimize your connection string for serverless environments:

```javascript
// Optimized connection options for serverless
const options = {
  serverSelectionTimeoutMS: 5000,  // Reduce from default 30s
  socketTimeoutMS: 45000,          // Keep socket alive longer
  connectTimeoutMS: 5000,          // Connect faster or fail
  maxPoolSize: 5,                  // Smaller connection pool for serverless
  minPoolSize: 1,                  // Maintain at least one connection
  bufferCommands: false,           // Don't buffer commands when disconnected
  autoIndex: false,                // Don't build indexes on connection
  family: 4                        // Force IPv4
};

mongoose.connect(process.env.CONNECTION_URL, options);
```

### 3. Connection Pooling Issues

Serverless functions may create too many connections that aren't properly closed.

**Solutions**:
- Use a smaller connection pool (`maxPoolSize: 5`)
- Implement connection caching (already done in our `DB/connection.js`)
- Use a connection management service like MongoDB Atlas Serverless

### 4. Cold Start Problems

Serverless functions that haven't been used recently experience "cold starts" where the function container needs to be initialized.

**Solutions**:
- Use the `/api/keepalive` endpoint with a cron job (already configured in `vercel.json`)
- Implement connection caching (already done in our code)
- Use MongoDB Atlas Serverless for better cold start performance

### 5. Authentication Issues

**Solutions**:
- Double-check username and password in connection string
- Ensure special characters in password are URL encoded
- Verify the user has appropriate permissions in MongoDB Atlas

## Advanced Troubleshooting

### Testing Direct MongoDB Connection

Use the `test-mongodb.js` script to test your connection outside of the Vercel environment:

```bash
# Set your connection string as an environment variable
export CONNECTION_URL="mongodb+srv://username:password@cluster.mongodb.net/database"

# Run the test script
node test-mongodb.js
```

### Debugging Connection Issues

Add these environment variables to your Vercel project for additional debugging:

```
DEBUG=mongodb:*,mongoose:*
DEBUG_DEPTH=5
```

### Checking Connection Status Programmatically

```javascript
// Check MongoDB connection state
const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
const currentState = mongoose.connection.readyState;
console.log(`MongoDB connection state: ${states[currentState]}`);

// Test connection with a ping
try {
  await mongoose.connection.db.admin().ping();
  console.log('MongoDB connection is healthy');
} catch (error) {
  console.error('MongoDB connection is not healthy:', error);
}
```

## Vercel-Specific Optimizations

### Function Duration

Increase the function duration limit for endpoints that interact with MongoDB:

```json
{
  "functions": {
    "api/db-intensive-endpoint.js": {
      "maxDuration": 60
    }
  }
}
```

### Memory Allocation

Increase memory allocation for database-intensive operations:

```json
{
  "functions": {
    "api/db-intensive-endpoint.js": {
      "memory": 1024
    }
  }
}
```

### Keep-Alive Strategy

Use a cron job to keep your function warm:

```json
{
  "crons": [
    {
      "path": "/api/keepalive",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## MongoDB Atlas Specific Settings

### Recommended Atlas Cluster Settings

1. **M0 Sandbox or higher tier** (Free tier has limitations that can affect serverless deployments)
2. **Enable Auto-Scale** if available on your plan
3. **Set appropriate backup strategy** for production data

### Network Settings

1. **IP Whitelist**: Add `0.0.0.0/0` to allow connections from anywhere
2. **Connection Security**: Enable TLS/SSL for all connections
3. **Private Endpoint**: Consider using AWS PrivateLink for production environments

## Best Practices for Serverless MongoDB

1. **Use connection pooling wisely**
   - Smaller pool sizes work better in serverless
   - Cache connections between function invocations

2. **Implement retry logic**
   - Add exponential backoff for failed operations
   - Use our `executeWithConnectionRetry` utility function

3. **Optimize query performance**
   - Create proper indexes for frequent queries
   - Use projection to limit returned fields
   - Set reasonable timeouts for operations

4. **Handle connection failures gracefully**
   - Return user-friendly error messages
   - Implement circuit breakers for repeated failures

5. **Monitor and log connection issues**
   - Use detailed logging for connection events
   - Set up alerts for connection failures

## Testing Your Connection

Visit these endpoints to test and monitor your MongoDB connection:

1. **Connection Test**: `/api/db-test?key=your_db_test_key`
2. **Keepalive Endpoint**: `/api/keepalive`
3. **Health Check**: `/health`

## Need More Help?

If you're still experiencing issues after trying these solutions:

1. Check MongoDB Atlas status page for any ongoing incidents
2. Review Vercel logs for specific error messages
3. Contact MongoDB Atlas support with your connection diagnostics
4. Review the [MongoDB Node.js Driver documentation](https://docs.mongodb.com/drivers/node/) for additional troubleshooting steps 