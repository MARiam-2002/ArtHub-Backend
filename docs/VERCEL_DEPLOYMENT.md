# Deploying ArtHub Backend to Vercel

This guide provides step-by-step instructions for deploying the ArtHub backend to Vercel with proper MongoDB connection configuration to avoid the common 503 Service Unavailable errors.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with a cluster set up
3. Your ArtHub Backend codebase ready for deployment

## Step 1: Prepare Your MongoDB Atlas Cluster

1. **Create or use an existing MongoDB Atlas cluster**
2. **Configure network access:**
   - Go to Network Access in MongoDB Atlas
   - Add `0.0.0.0/0` to allow access from all IPs (required for Vercel)
   - Or use more restrictive settings with [Vercel's IP ranges](https://vercel.com/docs/concepts/edge-network/regions#ip-addresses)

3. **Create a database user:**
   - Go to Database Access
   - Create a user with at least `readWrite` permissions for your database

4. **Get your connection string:**
   - Go to Clusters > Connect > Connect your application
   - Copy the connection string (it looks like `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)
   - Replace `username`, `password`, and `dbname` with your actual values

## Step 2: Configure Vercel Environment Variables

Environment variables should be set through the Vercel dashboard, not in `vercel.json`:

1. **Go to your Vercel dashboard**
2. **Select your project**
3. **Navigate to Settings > Environment Variables**
4. **Add the following environment variables:**

   | Name | Value | Description |
   |------|-------|-------------|
   | `CONNECTION_URL` | `mongodb+srv://...` | Your MongoDB connection string |
   | `TOKEN_KEY` | `your-secret-key` | JWT secret key |
   | `SALT_ROUND` | `10` | Password hashing rounds |
   | `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
   | `FIREBASE_CLIENT_EMAIL` | `your-client-email` | Firebase client email |
   | `FIREBASE_PRIVATE_KEY` | `your-private-key` | Firebase private key |
   | `CLOUD_NAME` | `your-cloud-name` | Cloudinary cloud name |
   | `API_KEY` | `your-api-key` | Cloudinary API key |
   | `API_SECRET` | `your-api-secret` | Cloudinary API secret |
   | `NODE_ENV` | `production` | Environment setting |

5. **Click Save**

## Step 3: Configure vercel.json

Create or update your `vercel.json` file with the following optimized settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "functions": {
    "index.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Step 4: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy your project:**
   ```bash
   vercel
   ```

4. **Follow the prompts to link your project**

## Step 5: Set Up Keep-Alive for Preventing Cold Starts

To prevent cold start issues with MongoDB connections, set up a service to ping your API regularly:

1. **Use a service like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)**
2. **Create a new job/monitor that pings your `/keepalive` endpoint**
3. **Set it to run every 5 minutes**

Example URL to ping: `https://your-vercel-app.vercel.app/keepalive`

## Troubleshooting Common Issues

### 503 Service Unavailable Errors

If you're experiencing 503 errors with database connection issues:

1. **Check Vercel logs:**
   - Go to your project dashboard
   - Click on "Deployments"
   - Select the latest deployment
   - Click on "Functions" and check the logs

2. **Verify environment variables:**
   - Ensure `CONNECTION_URL` is set correctly
   - Check for any typos or formatting issues

3. **Test MongoDB connection:**
   - Try connecting to your MongoDB Atlas cluster from your local machine
   - Ensure the user has proper permissions

4. **Check MongoDB Atlas status:**
   - Go to [MongoDB Atlas Status](https://status.mongodb.com/)
   - Check if there are any ongoing issues

### Function Timeout Issues

If your functions are timing out:

1. **Optimize your database queries:**
   - Add proper indexes to frequently queried fields
   - Use projection to limit returned fields
   - Implement pagination

2. **Increase function timeout:**
   - Verify your `vercel.json` has the `maxDuration` set to at least 30 seconds

## Best Practices for MongoDB on Vercel

1. **Use connection pooling with appropriate settings:**
   - Set `maxPoolSize` to 5 for serverless environments
   - Use `minPoolSize` of 1 to maintain at least one connection

2. **Implement connection caching:**
   - Store and reuse database connections between invocations
   - Check connection state before reusing

3. **Add proper error handling:**
   - Implement robust error handling for database operations
   - Return user-friendly error messages

4. **Monitor performance:**
   - Use Vercel Analytics to monitor function performance
   - Set up MongoDB Atlas monitoring

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/current/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [ArtHub MongoDB Troubleshooting Guide](./MONGODB_TROUBLESHOOTING.md) 