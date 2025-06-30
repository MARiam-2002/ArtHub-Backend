import { checkDatabaseConnection } from '../DB/connection.js';

/**
 * Keepalive endpoint for Vercel to prevent cold starts
 * This endpoint should be pinged every 5 minutes by an external service
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export default async function handler(req, res) {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    
    // Return status based on database connection
    if (isConnected) {
      res.status(200).json({
        status: 'ok',
        message: 'Server is alive',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'degraded',
        message: 'Server is alive but database connection failed',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in keepalive endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking server status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 