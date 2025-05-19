import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerDocument from './swagger.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Create custom Swagger UI HTML with absolute URLs
router.get('/', (req, res) => {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArtHub API Documentation</title>
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
    
    .topbar {
      background-color: #C1D1E6 !important;
      padding: 10px 0;
      text-align: center;
    }
    
    /* Logo and Header */
    .header-container {
      background-color: #C1D1E6;
      color: #333;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .logo-container {
      display: flex;
      align-items: center;
    }
    
    .logo {
      width: 120px;
      height: auto;
      margin-right: 15px;
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
    
    /* Custom Swagger UI Colors */
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
    
    .swagger-ui .opblock.opblock-put {
      background: rgba(193, 209, 230, 0.1);
      border-color: #C1D1E6;
    }
    
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .opblock.opblock-delete {
      background: rgba(193, 209, 230, 0.1);
      border-color: #C1D1E6;
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .opblock.opblock-patch {
      background: rgba(193, 209, 230, 0.1);
      border-color: #C1D1E6;
    }
    
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .btn.execute {
      background-color: #C1D1E6;
      border-color: #C1D1E6;
      color: #333;
    }
    
    .swagger-ui .btn.execute:hover {
      background-color: #A9C0DD;
      border-color: #A9C0DD;
    }
    
    .swagger-ui section.models .model-container,
    .swagger-ui section.models h4 {
      background: #f8f9fa;
      border-color: #eaebec;
    }
    
    .swagger-ui .info a {
      color: #C1D1E6;
    }
    
    .swagger-ui .scheme-container {
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    /* Fix button text color for better contrast */
    .swagger-ui .btn {
      color: #333;
    }
    
    /* Fix links color */
    .swagger-ui a.nostyle, 
    .swagger-ui a.nostyle:visited {
      color: #333 !important;
    }
    
    /* Fix tag headers */
    .swagger-ui .opblock-tag {
      border-color: #C1D1E6;
      background: rgba(193, 209, 230, 0.1);
    }
    
    /* Improve tab colors */
    .swagger-ui .tab-header .tab-item.active h4 {
      color: #333;
    }
    
    /* Improve scheme selection */
    .swagger-ui .scheme-container .schemes-title {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="logo-container">
      <img src="/assets/images/logo.png" alt="ArtHub Logo" class="logo">
      <div>
        <div class="title">ArtHub API</div>
        <div class="subtitle">وثائق API للعمليات الخلفية لتطبيق ArtHub</div>
      </div>
    </div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerDocument)},
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
        }
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

export default router;
