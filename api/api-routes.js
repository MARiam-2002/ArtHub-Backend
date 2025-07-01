import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      status: 405
    });
  }

  try {
    // Get current directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '..');

    // Function to extract routes from a router file
    const extractRoutes = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const routes = [];

        // Match router.METHOD patterns
        const routerMethodRegex = /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;
        let match;
        while ((match = routerMethodRegex.exec(content)) !== null) {
          routes.push({
            method: match[1].toUpperCase(),
            path: match[2]
          });
        }

        // Match app.use patterns for sub-routers
        const appUseRegex = /app\.use\(['"]([^'"]+)['"]/g;
        while ((match = appUseRegex.exec(content)) !== null) {
          routes.push({
            type: 'router',
            basePath: match[1]
          });
        }

        return routes;
      } catch (error) {
        console.error(`Error extracting routes from ${filePath}:`, error);
        return [];
      }
    };

    // Collect API routes from index.router.js
    const indexRouterPath = path.join(projectRoot, 'src', 'index.router.js');
    const mainRoutes = extractRoutes(indexRouterPath);

    // Collect API routes from module routers
    const moduleRoutes = {};
    const modulesDir = path.join(projectRoot, 'src', 'modules');
    
    if (fs.existsSync(modulesDir)) {
      const modules = fs.readdirSync(modulesDir);
      
      for (const module of modules) {
        const moduleDir = path.join(modulesDir, module);
        if (fs.statSync(moduleDir).isDirectory()) {
          // Look for router files
          const routerFiles = fs.readdirSync(moduleDir)
            .filter(file => file.includes('router') && file.endsWith('.js'));
            
          if (routerFiles.length > 0) {
            const routerPath = path.join(moduleDir, routerFiles[0]);
            const routes = extractRoutes(routerPath);
            if (routes.length > 0) {
              moduleRoutes[module] = routes;
            }
          }
        }
      }
    }

    // Collect API routes from api directory (serverless functions)
    const apiRoutes = [];
    const apiDir = path.join(projectRoot, 'api');
    
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs.readdirSync(apiDir)
        .filter(file => file.endsWith('.js'));
        
      for (const file of apiFiles) {
        apiRoutes.push({
          name: file.replace('.js', ''),
          path: `/api/${file.replace('.js', '')}`
        });
      }
    }

    // Get vercel.json routes if available
    let vercelRoutes = [];
    const vercelConfigPath = path.join(projectRoot, 'vercel.json');
    
    if (fs.existsSync(vercelConfigPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        if (vercelConfig.routes && Array.isArray(vercelConfig.routes)) {
          vercelRoutes = vercelConfig.routes.map(route => ({
            src: route.src,
            dest: route.dest
          }));
        }
      } catch (error) {
        console.error('Error parsing vercel.json:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'API routes retrieved successfully',
      data: {
        mainRoutes,
        moduleRoutes,
        apiRoutes,
        vercelRoutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving API routes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving API routes',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
} 