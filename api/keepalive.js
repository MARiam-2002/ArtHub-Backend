import { checkDatabaseConnection } from '../DB/connection.js';
import mongoose from 'mongoose';

/**
 * Keepalive endpoint for Vercel
 * This endpoint helps prevent cold starts by keeping the function warm
 * It also checks the database connection and returns a lightweight response
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
export default async function handler(req, res) {
  try {
    // Check if MongoDB is connected
    const isConnected = mongoose.connection.readyState === 1;
    
    // If not connected, try to connect
    let connectionStatus = 'existing';
    if (!isConnected) {
      try {
        // Attempt to connect with a short timeout
        await checkDatabaseConnection();
        connectionStatus = 'reconnected';
      } catch (connErr) {
        connectionStatus = 'failed';
      }
    }
    
    // Return a lightweight response
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: {
        connected: mongoose.connection.readyState === 1,
        status: connectionStatus
      },
      instance: process.env.VERCEL_REGION || 'unknown'
    });
  } catch (error) {
    console.error('Keepalive error:', error);
    
    // Still return 200 to avoid triggering alerts
    res.status(200).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 