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
       bufferCommands: true,
       bufferTimeoutMS: 30000
     }
     ```

3. **Check network connectivity**
   - Ensure your server can reach MongoDB Atlas or your MongoDB server
   - For MongoDB Atlas, check if your IP is whitelisted in the Network Access settings

4. **Verify MongoDB server status**
   - For self-hosted MongoDB, check if the MongoDB service is running
   - For MongoDB Atlas, check the cluster status in the Atlas dashboard

### 2. Authentication Failed

**Error Message:**
```
MongoServerError: Authentication failed
```

**Solutions:**
1. **Check credentials**
   - Verify username and password in your connection string
   - Ensure the user has appropriate permissions for the database

2. **Database user permissions**
   - Make sure the user has read/write access to the database
   - In MongoDB Atlas, check Database Access settings

### 3. Network Connectivity Issues

**Error Message:**
```
MongooseServerSelectionError: getaddrinfo ENOTFOUND cluster0.example.mongodb.net
```

**Solutions:**
1. **Check DNS resolution**
   - Verify that the hostname in your connection string is correct
   - Try pinging the MongoDB host to check connectivity

2. **Firewall settings**
   - Ensure your firewall allows outbound connections to MongoDB (port 27017)
   - For cloud hosting, check security group settings

3. **IP Whitelist**
   - For MongoDB Atlas, add your server's IP address to the IP whitelist

## Quick Fixes

1. **Restart the application**
   - Sometimes a simple restart can resolve temporary connection issues

2. **Use connection pooling**
   - Set appropriate `maxPoolSize` in connection options (default is 5)

3. **Enable automatic reconnection**
   - Set `autoReconnect: true` in connection options

4. **Use retry mechanism**
   - The application now includes automatic retry logic for connection failures

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