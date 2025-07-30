import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArtHub Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running properly',
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger Documentation
app.get('/api-docs', (req, res) => {
  res.redirect('/api-docs/');
});

app.get('/api-docs/', (req, res) => {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArtHub API Documentation | توثيق واجهة برمجة التطبيقات</title>
  <meta name="description" content="توثيق كامل لواجهة برمجة التطبيقات (API) الخاصة بتطبيق ArtHub للمبدعين والفنانين">
  
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
  
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8f9fa;
    }
    
    #swagger-ui { 
      max-width: 1460px; 
      margin: 0 auto; 
    }
    
    .header-container {
      background-color: #C1D1E6;
      color: #333;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    
    .subtitle {
      font-size: 16px;
      opacity: 0.8;
      color: #333;
    }
    
    .swagger-ui .opblock.opblock-post {
      background: rgba(193, 209, 230, 0.1);
      border-color: #C1D1E6;
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .opblock.opblock-get {
      background: rgba(193, 209, 230, 0.1);
      border-color: #C1D1E6;
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .btn.execute {
      background-color: #C1D1E6;
      border-color: #C1D1E6;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title">ArtHub API Documentation</div>
    <div class="subtitle">توثيق واجهة برمجة التطبيقات</div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: 'list',
        defaultModelRendering: 'model',
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: 'agate'
        },
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, 'src', 'swagger', 'arthub-swagger.json');
    res.sendFile(swaggerPath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Swagger documentation not available',
      error: error.message
    });
  }
});

// API routes placeholder
app.get('/api/auth/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth endpoint placeholder',
    path: req.path
  });
});

app.get('/api/user/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User endpoint placeholder',
    path: req.path
  });
});

app.get('/api/artworks/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Artworks endpoint placeholder',
    path: req.path
  });
});

app.get('/api/admin/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin endpoint placeholder',
    path: req.path
  });
});

app.get('/api/dashboard/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard endpoint placeholder',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📡 API Health: http://localhost:${port}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${port} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app; 