# Fixing MongoDB Connection Issues in Vercel Deployments

## Common Error: 503 Service Unavailable

If you're seeing a 503 Service Unavailable error with a message like:

```json
{
  "success": false,
  "status": 503,
  "message": "الخدمة غير متوفرة",
  "error": "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا",
  "errorCode": "DB_CONNECTION_ERROR",
  "timestamp": "2025-07-01T00:13:32.726Z"
}
```

This indicates a database connection issue in your Vercel deployment. Here's how to fix it:

## Step 1: Check MongoDB Atlas IP Whitelist (Most Common Issue)

The most common cause of this error is that MongoDB Atlas is blocking connections from Vercel's serverless functions.

1. Log in to your MongoDB Atlas account
2. Go to Network Access under Security
3. Add `0.0.0.0/0` to the IP Access List (this allows connections from anywhere)
4. Save changes

> **Why this works:** Vercel's serverless functions use dynamic IP addresses that change between invocations. Adding `0.0.0.0/0` allows connections from any IP address.

## Step 2: Verify Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Ensure `CONNECTION_URL` is set correctly with your MongoDB connection string
4. The format should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
5. Redeploy your project after making changes

## Step 3: Check MongoDB Atlas User Permissions

1. In MongoDB Atlas, go to Database Access
2. Ensure the user in your connection string has appropriate permissions
3. The user should have at least "readWrite" access to your database

## Step 4: Test Your Connection

Use the built-in database test endpoint to diagnose connection issues:

```
https://your-app.vercel.app/api/db-test
```

This will provide detailed information about your database connection status.

## Step 5: Check for Specific Error Messages

If you're still having issues, check the Vercel logs for specific error messages:

1. Go to your Vercel project dashboard
2. Click on the latest deployment
3. Go to Functions > index.js > Logs
4. Look for error messages related to MongoDB

Common error patterns and their solutions:

### "Operation `users.findOne()` buffering timed out after 10000ms"

This occurs when MongoDB operations are queued while waiting for a connection, but the connection isn't established within the timeout period.

**Solution:**
- Add `0.0.0.0/0` to MongoDB Atlas IP whitelist
- Increase connection timeouts in `DB/connection.js`
- Ensure your MongoDB Atlas cluster is running

### "MongoServerSelectionError: connection timed out"

MongoDB driver couldn't select a server to connect to within the specified timeout.

**Solution:**
- Check MongoDB Atlas status (https://status.mongodb.com/)
- Verify your connection string is correct
- Add `0.0.0.0/0` to MongoDB Atlas IP whitelist

### "MongoNetworkError: failed to connect to server"

Network-level connection failure.

**Solution:**
- Check if MongoDB Atlas is accessible from your network
- Verify your connection string is correct
- Check if MongoDB Atlas has any maintenance or outages

## Step 6: Optimize Your Connection for Serverless

Our codebase already includes optimizations for serverless environments, but you can verify they're working correctly:

1. Connection pooling with small pool size (`maxPoolSize: 1`)
2. Connection caching between function invocations
3. Automatic reconnection logic
4. Keep-alive mechanisms to prevent cold starts

## Step 7: Prevent Cold Starts with Cron Jobs

Vercel's serverless functions can experience "cold starts" where the function container needs to be initialized. This can cause the first request after inactivity to fail.

We've already configured cron jobs in `vercel.json` to keep the functions warm:

```json
"crons": [
  {
    "path": "/api/keepalive",
    "schedule": "*/5 * * * *"
  },
  {
    "path": "/health",
    "schedule": "*/10 * * * *"
  }
]
```

## Still Having Issues?

If you've tried all the steps above and are still experiencing connection issues, you can try the following:

1. **Use MongoDB Atlas M10 or higher tier** - The free tier has limitations that can affect serverless deployments
2. **Consider using a dedicated connection service** - Services like Prisma Data Proxy or MongoDB Atlas Data API can help manage connections in serverless environments
3. **Check for MongoDB Atlas region compatibility** - Ensure your MongoDB Atlas cluster is in a region close to your Vercel deployment region

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Serverless Functions Documentation](https://vercel.com/docs/functions)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/current/) 