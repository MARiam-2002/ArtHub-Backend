import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerJsonPath = path.join(__dirname, 'arthub-swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));

let logoBase64 = '';
try {
  const logoPath = path.join(__dirname, '..', 'public', 'assets', 'images', 'logo.png');
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (error) {
  console.error('Error loading logo:', error);
  logoBase64 = '/assets/images/logo.png';
}

const router = Router();

const FALLBACK_PRODUCTION_URL = process.env.API_URL || 'https://arthub-api.vercel.app';

/**
 * Build OpenAPI servers list with the current request origin first so
 * Swagger "Try it out" hits the same host the UI is served from.
 */
function buildSpecForRequest(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();
  const origin = host ? `${proto}://${host}` : FALLBACK_PRODUCTION_URL;

  const spec = structuredClone(swaggerDocument);
  const otherServers = (swaggerDocument.servers || []).filter(
    s => s.url !== origin && s.url !== '/' && !s.url.includes('localhost')
  );

  spec.servers = [
    { url: origin, description: 'Current deployment (Try it out)' },
    { url: '/', description: 'Same origin' },
    ...otherServers,
    { url: 'http://localhost:3000', description: 'Local development' }
  ];

  // Prefer production URL when served from Vercel but API_URL is set
  if (process.env.VERCEL && process.env.API_URL && process.env.API_URL !== origin) {
    spec.servers.unshift({
      url: process.env.API_URL,
      description: 'Configured production API'
    });
  }

  return spec;
}

// JSON endpoint for tooling / Swagger clients
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.json(buildSpecForRequest(req));
});

router.get('/', (req, res) => {
  const siteUrl =
    process.env.API_URL ||
    `${(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim()}://${(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim()}` ||
    FALLBACK_PRODUCTION_URL;

  const spec = buildSpecForRequest(req);

  const swaggerHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArtHub API Documentation | توثيق واجهة برمجة التطبيقات</title>
  <meta name="description" content="توثيق كامل لواجهة برمجة التطبيقات (API) الخاصة بتطبيق ArtHub للمبدعين والفنانين">
  <meta name="keywords" content="ArtHub, API, documentation, توثيق, واجهة برمجة التطبيقات, فن, إبداع">
  
  <link rel="icon" type="image/png" href="${logoBase64}" />
  
  <meta property="og:title" content="ArtHub API Documentation">
  <meta property="og:description" content="توثيق كامل لواجهة برمجة التطبيقات (API) الخاصة بتطبيق ArtHub للمبدعين والفنانين">
  <meta property="og:image" content="${logoBase64}">
  <meta property="og:url" content="${siteUrl}/api-docs">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_SA">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="ArtHub API Documentation">
  <meta name="twitter:description" content="توثيق كامل لواجهة برمجة التطبيقات (API) الخاصة بتطبيق ArtHub للمبدعين والفنانين">
  <meta name="twitter:image" content="${logoBase64}">
  
  <link rel="preload" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" as="style">
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
    
    .swagger-ui .btn {
      color: #333;
    }
    
    .swagger-ui a.nostyle, 
    .swagger-ui a.nostyle:visited {
      color: #333 !important;
    }
    
    .swagger-ui .opblock-tag {
      border-color: #C1D1E6;
      background: rgba(193, 209, 230, 0.1);
    }
    
    .swagger-ui .tab-header .tab-item.active h4 {
      color: #333;
    }
    
    .swagger-ui .scheme-container .schemes-title {
      color: #333;
    }
    
    @media screen and (max-width: 768px) {
      .header-container {
        flex-direction: column;
        text-align: center;
        padding: 15px 10px;
      }
      
      .logo-container {
        flex-direction: column;
        margin-bottom: 10px;
      }
      
      .logo {
        margin-right: 0;
        margin-bottom: 10px;
        width: 80px;
      }
      
      .title {
        font-size: 20px;
      }
      
      .subtitle {
        font-size: 14px;
      }
      
      .swagger-ui .opblock .opblock-summary {
        display: flex;
        flex-direction: column;
      }
      
      .swagger-ui .opblock .opblock-summary-method {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="logo-container">
      <img src="${logoBase64}" alt="ArtHub Logo" class="logo">
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
        spec: ${JSON.stringify(spec)},
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
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        requestInterceptor: function(request) {
          // Ensure relative URLs resolve against the selected server
          return request;
        },
        responseInterceptor: function(response) {
          return response;
        },
        onComplete: function() {
          // Keep default server as current deployment origin
        }
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.send(swaggerHtml);
});

export default router;
