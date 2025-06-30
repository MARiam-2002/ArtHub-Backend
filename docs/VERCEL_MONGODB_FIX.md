# Fixing MongoDB Connection Issues in Vercel

This guide provides step-by-step instructions to resolve the "503 Service Unavailable" error and MongoDB connection timeouts in your Vercel deployment.

## Quick Fix Checklist

1. **Whitelist Vercel IP addresses in MongoDB Atlas**
   - Log in to MongoDB Atlas
   - Go to Network Access under Security
   - Add `0.0.0.0/0` to allow all IP addresses
   - This is the most common solution for this error

2. **Verify Environment Variables in Vercel**
   - Check that `CONNECTION_URL` is correctly set in Vercel's environment variables
   - Ensure there are no typos or special characters that need URL encoding
   - Make sure the connection string format is correct:
     ```
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
     ```

3. **Test Your Connection String**
   - Run the `test-mongodb.js` script locally to verify your connection string works
   - If it fails locally, fix the connection string before deploying

4. **Check MongoDB Atlas Status**
   - Visit the [MongoDB Atlas Status Page](https://status.mongodb.com/)
   - Ensure there are no ongoing issues with the service

5. **Redeploy Your Application**
   - After making these changes, redeploy your application to Vercel

## Detailed Solutions

### 1. MongoDB Atlas IP Whitelist Configuration

The most common cause of the "Operation `users.findOne()` buffering timed out after 10000ms" error is IP whitelisting. Vercel uses dynamic IP addresses, so you need to allow all IPs:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project and cluster
3. Click on "Network Access" in the left sidebar
4. Click "ADD IP ADDRESS"
5. Click "ALLOW ACCESS FROM ANYWHERE" or manually enter `0.0.0.0/0`
6. Click "Confirm"

### 2. Vercel Environment Variables

Ensure your environment variables are correctly set in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Check that `CONNECTION_URL` is set correctly
4. If needed, update the value and redeploy your application

### 3. Using the Database Test Endpoint

We've added a database test endpoint that can help diagnose connection issues:

1. Visit `https://your-app-url.vercel.app/api/db-test?key=your_db_test_key`
2. Check the response for detailed connection diagnostics
3. Look for specific error messages that can help identify the issue

### 4. Connection Pooling and Caching

We've already implemented connection pooling and caching in the codebase:

- Connection pooling with optimized settings for serverless environments
- Connection caching to reuse connections between function invocations
- Automatic reconnection with exponential backoff
- Proper error handling and diagnostics

### 5. Keepalive Mechanism

To prevent cold starts, we've implemented:

- A keepalive endpoint that's pinged every 5 minutes
- A health check endpoint that's pinged every 10 minutes
- These help keep the function warm and maintain database connections

## Verifying the Fix

After implementing these solutions, you can verify that the connection is working:

1. Visit your API endpoint: `https://your-app-url.vercel.app/api`
2. Check the health endpoint: `https://your-app-url.vercel.app/health`
3. Monitor your Vercel function logs for any remaining connection issues

## Additional Troubleshooting

If you're still experiencing issues:

1. **Check MongoDB Atlas Cluster Status**
   - Ensure your cluster is active and not in maintenance mode
   - Check if there are any alerts or warnings in your Atlas dashboard

2. **Test Connection String Directly**
   - Use a tool like MongoDB Compass to test your connection string
   - This can help identify if the issue is with the connection string or the application

3. **Check for Connection Pooling Issues**
   - If you're seeing intermittent connection issues, it might be related to connection pooling
   - Adjust the maxPoolSize and minPoolSize settings in the connection options

4. **Monitor Function Memory Usage**
   - If your functions are running out of memory, increase the memory allocation in vercel.json
   - Memory issues can cause connection problems

5. **Use the Diagnostic Endpoint**
   - The `/api/db-test` endpoint provides detailed diagnostics
   - Use this to identify specific connection issues

## Contact Support

If you've tried all these solutions and are still experiencing issues, please contact support with:

1. The specific error messages you're seeing
2. The steps you've taken to troubleshoot
3. Your Vercel function logs
4. The results from the `/api/db-test` endpoint

This will help us provide more targeted assistance for your specific issue. 