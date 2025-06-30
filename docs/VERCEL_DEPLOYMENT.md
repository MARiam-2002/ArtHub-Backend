# Vercel Deployment Guide for ArtHub Backend

This guide provides step-by-step instructions for deploying the ArtHub Backend on Vercel with a focus on MongoDB connection optimization.

## Prerequisites

- A [Vercel](https://vercel.com/) account
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with a cluster set up
- Your project code in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Project

### Ensure Vercel Compatibility

1. Make sure your project has:
   - A `package.json` file with all dependencies
   - An `index.js` file as the entry point
   - A `vercel.json` configuration file

2. Check that your `vercel.json` file includes:

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
    "api/db-test.js": {
      "memory": 1024,
      "maxDuration": 10
    },
    "api/keepalive.js": {
      "memory": 512,
      "maxDuration": 5
    },
    "index.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/keepalive",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Optimize MongoDB Connection

1. Update your MongoDB connection code to handle serverless environments:
   - Use connection pooling with appropriate limits
   - Implement connection caching
   - Add retry logic for failed connections
   - Set appropriate timeouts

2. Our `DB/connection.js` file already includes these optimizations:
   - Connection caching
   - Exponential backoff for reconnection
   - Serverless-specific connection options
   - Proper error handling

## Step 2: Configure MongoDB Atlas

### Set Up Network Access

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Go to **Network Access** under the Security section
4. Click **ADD IP ADDRESS**
5. Add `0.0.0.0/0` to allow access from anywhere (required for Vercel's dynamic IPs)
6. Click **Confirm**

### Create a Database User

1. Go to **Database Access** under the Security section
2. Click **ADD NEW DATABASE USER**
3. Choose **Password** authentication
4. Enter a username and password
5. Set **Database User Privileges** to **Read and Write to Any Database**
6. Click **Add User**

### Get Your Connection String

1. Go to your cluster's overview page
2. Click **Connect**
3. Choose **Connect your application**
4. Select **Node.js** as the driver and the appropriate version
5. Copy the connection string
6. Replace `<password>` with your database user's password
7. Replace `myFirstDatabase` with your database name

## Step 3: Deploy to Vercel

### Connect Your Repository

1. Log in to [Vercel](https://vercel.com/)
2. Click **New Project**
3. Import your Git repository
4. Select the repository containing your ArtHub Backend code

### Configure Project Settings

1. Set the **Framework Preset** to **Other**
2. Set the **Root Directory** if your code is not in the repository root
3. Set the **Build Command** to `npm install`
4. Set the **Output Directory** to `.`
5. Set the **Install Command** to `npm install`

### Configure Environment Variables

Add the following environment variables:

1. `CONNECTION_URL`: Your MongoDB Atlas connection string
2. `TOKEN_KEY`: A secure random string for JWT signing
3. `SALT_ROUND`: Number of salt rounds for password hashing (e.g., `10`)
4. `NODE_ENV`: Set to `production`
5. `DB_TEST_KEY`: A secure random string for accessing the database test endpoint
6. Any other environment variables your application needs

### Deploy

1. Click **Deploy**
2. Wait for the deployment to complete
3. Once deployed, Vercel will provide a URL for your application

## Step 4: Verify Deployment

### Test API Endpoints

1. Test the base API endpoint:
   ```
   https://your-app-url.vercel.app/api
   ```

2. Test the MongoDB connection using the db-test endpoint:
   ```
   https://your-app-url.vercel.app/api/db-test?key=your_db_test_key
   ```

3. Check the health endpoint:
   ```
   https://your-app-url.vercel.app/health
   ```

### Monitor Logs

1. Go to your project on Vercel
2. Click **Deployments**
3. Select your latest deployment
4. Click **Functions**
5. Select a function to view its logs
6. Look for any MongoDB connection errors

## Step 5: Optimize Performance

### Enable Cron Jobs

Vercel's cron jobs will automatically ping your keepalive endpoint to prevent cold starts. Verify that the cron job is set up correctly:

1. Go to your project settings
2. Click on **Cron Jobs**
3. Verify that the `/api/keepalive` job is scheduled to run every 5 minutes

### Monitor Performance

1. Go to your project on Vercel
2. Click **Analytics**
3. Monitor function execution times and error rates
4. Look for any performance issues related to MongoDB connections

## Troubleshooting

If you encounter MongoDB connection issues, refer to the [MongoDB Troubleshooting Guide](MONGODB_TROUBLESHOOTING.md) for detailed solutions.

Common issues include:

1. **IP Whitelist**: Ensure `0.0.0.0/0` is added to your MongoDB Atlas IP Access List
2. **Connection String**: Verify your connection string format and credentials
3. **Environment Variables**: Check that all environment variables are correctly set in Vercel
4. **Function Timeout**: Increase the function duration limit if operations are timing out

## Best Practices for Vercel Deployment

1. **Use Edge Functions** for improved performance when possible
2. **Implement proper error handling** for database operations
3. **Set up monitoring and alerts** for critical functions
4. **Use appropriate caching strategies** to reduce database load
5. **Implement rate limiting** to prevent abuse
6. **Regularly update dependencies** to address security vulnerabilities
7. **Set up preview deployments** for testing changes before production

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js MongoDB Driver Documentation](https://docs.mongodb.com/drivers/node/)
- [Mongoose Documentation](https://mongoosejs.com/docs/) 