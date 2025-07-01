import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

/**
 * API Routes endpoint for Vercel
 * This endpoint returns all available API routes for debugging
 * @param {import('http').IncomingMessage} req - HTTP request
 * @param {import('http').ServerResponse} res - HTTP response
 */
export default async function handler(req, res) {
  // Set CORS headers for API endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // List of all available API routes
  const apiRoutes = {
    diagnostics: [
      { path: '/api/direct-connect', method: 'GET', description: 'Test direct connection to MongoDB' },
      { path: '/api/mongo-debug', method: 'GET', description: 'Get MongoDB connection debug information' },
      { path: '/api/db-test', method: 'GET', description: 'Run comprehensive MongoDB connection tests' },
      { path: '/api/keepalive', method: 'GET', description: 'Keepalive endpoint to prevent cold starts' },
      { path: '/api/api-routes', method: 'GET', description: 'List all available API routes (this endpoint)' },
      { path: '/health', method: 'GET', description: 'Check API health status' },
      { path: '/api', method: 'GET', description: 'API root endpoint' }
    ],
    auth: [
      { path: '/api/auth/register', method: 'POST', description: 'Register a new user' },
      { path: '/api/auth/login', method: 'POST', description: 'Login with email and password' }
    ],
    user: [
      { path: '/api/user/profile', method: 'GET', description: 'Get user profile' },
      { path: '/api/user/profile', method: 'PUT', description: 'Update user profile' }
    ],
    artwork: [
      { path: '/api/artworks', method: 'GET', description: 'Get all artworks' },
      { path: '/api/artworks/:id', method: 'GET', description: 'Get artwork by ID' }
    ],
    image: [
      { path: '/api/image/upload', method: 'POST', description: 'Upload an image' },
      { path: '/api/image/:id', method: 'GET', description: 'Get image by ID' }
    ],
    documentation: [
      { path: '/api-docs', method: 'GET', description: 'API documentation with Swagger UI' }
    ]
  };
  
  // Return list of routes
  return res.status(200).json({
    success: true,
    message: 'Available API routes',
    apiRoutes,
    environment: {
      node: process.version,
      env: process.env.NODE_ENV || 'development',
      serverless: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION || 'unknown'
    },
    timestamp: new Date().toISOString()
  });
} 