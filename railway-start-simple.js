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
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title">ArtHub API</div>
    <div class="subtitle">وثائق API للعمليات الخلفية لتطبيق ArtHub</div>
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

// Serve swagger.json
app.get('/api-docs/swagger.json', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, 'src', 'swagger', 'arthub-swagger.json');
    const swaggerData = JSON.parse(require('fs').readFileSync(swaggerPath, 'utf8'));
    res.json(swaggerData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load Swagger documentation',
      message: error.message
    });
  }
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
    path: req.originalUrl
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`🔗 Health Check: http://localhost:${port}/health`);
});

export default app; 