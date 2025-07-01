# Deploying ArtHub Backend on Vercel

This guide provides step-by-step instructions for deploying the ArtHub Backend API on Vercel with MongoDB Atlas integration.

## Prerequisites

Before you begin, make sure you have:

1. A [Vercel](https://vercel.com/) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with a cluster set up
3. The ArtHub Backend codebase on your local machine or in a GitHub repository

## Step 1: Prepare Your MongoDB Atlas Cluster

1. **Create a MongoDB Atlas Cluster** (or use an existing one)
   - Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new project if needed
   - Build a new cluster (the M0 free tier is sufficient for development)

2. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a user with password authentication
   - Set appropriate permissions (readWrite to your database)
   - Save the username and password for later

3. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "ALLOW ACCESS FROM ANYWHERE" (important for Vercel deployment)
   - This adds `0.0.0.0/0` to your IP whitelist
   - Click "Confirm"

4. **Get Your Connection String**
   - Go to "Clusters" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your actual values

## Step 2: Prepare Your Code for Deployment

1. **Ensure your `vercel.json` file is configured correctly**

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
    },
    {
      "path": "/health",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/db-test",
      "schedule": "*/15 * * * *"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Check your `package.json` file**
   - Ensure all dependencies are listed correctly
   - Make sure the "type" field is set to "module" for ES modules
   - Verify that the "engines" field includes the Node.js version you want to use

```json
{
  "name": "arthub-backend",
  "version": "1.0.0",
  "description": "ArtHub Backend API",
  "main": "index.js",
  "type": "module",
  "engines": {
    "node": ">=16.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
  // other fields...
}
```

## Step 3: Deploy to Vercel

### Option 1: Deploy from GitHub

1. **Push your code to GitHub**
   - Create a new repository or use an existing one
   - Push your code to the repository

2. **Import your project to Vercel**
   - Log in to [Vercel](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings:
     - Framework Preset: Other
     - Root Directory: ./
     - Build Command: (leave empty)
     - Output Directory: (leave empty)

3. **Configure Environment Variables**
   - Expand the "Environment Variables" section
   - Add the following variables:
     - `CONNECTION_URL`: Your MongoDB Atlas connection string
     - `TOKEN_KEY`: A secure random string for JWT signing
     - `SALT_ROUND`: 10 (or your preferred value)
     - Add any other environment variables your application needs

4. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

### Option 2: Deploy using Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Log in to Vercel**

   ```bash
   vercel login
   ```

3. **Configure Environment Variables**
   - Create a `.env.production` file with your environment variables
   - Or set them using the CLI:

   ```bash
   vercel env add CONNECTION_URL
   # Enter your MongoDB connection string when prompted

   vercel env add TOKEN_KEY
   # Enter your JWT secret when prompted

   # Add other environment variables as needed
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

## Step 4: Verify Your Deployment

1. **Check the deployment status**
   - Vercel will provide a URL for your deployed application
   - Visit the URL to verify that the deployment was successful

2. **Test the API endpoints**
   - Test the base endpoint: `https://your-app-url.vercel.app/api`
   - Check the health endpoint: `https://your-app-url.vercel.app/health`
   - Test the database connection: `https://your-app-url.vercel.app/api/db-test`

3. **Monitor the logs**
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Deployments" and select the latest deployment
   - Click "Functions" and select a function to view its logs

## Troubleshooting Common Issues

### Database Connection Issues

If you see a 503 Service Unavailable error or database connection errors:

1. **Check MongoDB Atlas IP Whitelist**
   - Ensure `0.0.0.0/0` is in your IP whitelist
   - Vercel uses dynamic IPs, so you need to allow all IPs

2. **Verify Environment Variables**
   - Check that `CONNECTION_URL` is set correctly in Vercel
   - Make sure there are no typos or special characters that need URL encoding

3. **Check MongoDB Atlas User Permissions**
   - Ensure the user has appropriate permissions for the database

4. **Test Your Connection String**
   - Use the `test-mongodb.js` script locally to verify your connection string works

For detailed troubleshooting steps, see [MONGODB_TROUBLESHOOTING.md](./MONGODB_TROUBLESHOOTING.md) and [VERCEL_MONGODB_FIX.md](./VERCEL_MONGODB_FIX.md).

### Function Timeout Issues

If your functions are timing out:

1. **Increase Function Duration**
   - Update the `maxDuration` in `vercel.json` for the affected functions
   - Note that Vercel has a maximum limit of 60 seconds for the Hobby plan

2. **Optimize Database Queries**
   - Add proper indexes to your MongoDB collections
   - Use projection to limit returned fields
   - Implement pagination for large result sets

### Cold Start Issues

If the first request after inactivity is slow or fails:

1. **Use Cron Jobs to Keep Functions Warm**
   - We've already configured cron jobs in `vercel.json`
   - These ping the API every few minutes to keep it warm

2. **Optimize Your Code for Cold Starts**
   - Minimize dependencies
   - Use lazy loading for heavy modules
   - Implement connection caching (already done in our code)

## Monitoring and Maintenance

### Monitoring Your Deployment

1. **Set up Monitoring**
   - Use Vercel Analytics to monitor your API performance
   - Consider setting up external monitoring with tools like UptimeRobot

2. **Check Logs Regularly**
   - Review function logs in the Vercel dashboard
   - Look for errors or performance issues

### Updating Your Deployment

1. **Push Changes to GitHub**
   - If you deployed from GitHub, Vercel will automatically deploy new changes

2. **Manual Deployment**
   - If you're using the CLI, run `vercel --prod` to deploy updates

## Scaling Considerations

As your application grows, consider the following:

1. **Upgrade MongoDB Atlas Tier**
   - The M0 free tier has limitations that can affect performance
   - Consider upgrading to M10 or higher for production use

2. **Optimize Database Performance**
   - Create proper indexes for your queries
   - Use MongoDB Atlas Performance Advisor

3. **Consider Vercel Pro Plan**
   - Longer function execution times
   - More generous build execution limits
   - Team collaboration features

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js on Vercel](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
