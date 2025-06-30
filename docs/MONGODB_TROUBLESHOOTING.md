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