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
      background-color: #6B4EFF !important;
      padding: 10px 0;
      text-align: center;
    }
    
    /* Logo and Header */
    .header-container {
      background-color: #6B4EFF;
      color: white;
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
      width: 80px;
      height: auto;
      margin-right: 15px;
    }
    
    .title {
      font-size: 24px;
      font-weight: bold;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.8;
    }
    
    /* Custom Swagger UI Colors */
    .swagger-ui .opblock.opblock-post {
      background: rgba(107, 78, 255, 0.1);
      border-color: #6B4EFF;
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #6B4EFF;
    }
    
    .swagger-ui .opblock.opblock-get {
      background: rgba(97, 175, 254, 0.1);
      border-color: #61affe;
    }
    
    .swagger-ui .opblock.opblock-put {
      background: rgba(252, 161, 48, 0.1);
      border-color: #fca130;
    }
    
    .swagger-ui .opblock.opblock-delete {
      background: rgba(249, 62, 62, 0.1);
      border-color: #f93e3e;
    }
    
    .swagger-ui .opblock.opblock-patch {
      background: rgba(80, 227, 194, 0.1);
      border-color: #50e3c2;
    }
    
    .swagger-ui .btn.execute {
      background-color: #6B4EFF;
      border-color: #6B4EFF;
    }
    
    .swagger-ui .btn.execute:hover {
      background-color: #5336FF;
    }
    
    .swagger-ui section.models .model-container,
    .swagger-ui section.models h4 {
      background: #f8f9fa;
      border-color: #eaebec;
    }
    
    .swagger-ui .info a {
      color: #6B4EFF;
    }
    
    .swagger-ui .scheme-container {
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="logo-container">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKsAAACrCAYAAAAZ6GwZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAQgUlEQVR4nO2df2xT1RvHPyvTbSuDLoM5JaxqoE5CXGKCGC34q1LEKcbw2yWbIUvAEPavDP7BH/xKjAkxOAiSCKKZ/IF/oGhkCXEGUDA4jCIkENDJNkQSui5s1yF5/7jbfXff3dv29r59b9v7+SNN7t6+957be57znOec55lDmGiMHD0LGAV0AfoA/YHrgVwgF8gCegKdU8dWA38AvwPngW9Kii9w/aZUwBF2BxKZkaNnQTQ09CjQB6KGvAW4EbgJ6IJmaHOR+VYBfwE/oRn6Z+BT4OOS4gv/+O5DGolrVh+MHD0r+lfVDQrxJgwDhgL3AfeiGTQM/gK+Bb4G9qEZ+Bvgh5LiC7UB67wmZrNGje3uXVPrB4XoExgBPADcjeYpw2AE8BXwFfAlsB34NKrSh21uXVMO15wCeZq7nR0nai+7O6dFxCkwFBgPjAPuAboGrdcjfgeOAkdCkDLVRNWvHwLfAptLii/86PHadthq1qixrx/YLTOvvLuMWZeusXpavWuucEvKJ6KVFyP5lP7AXQA+7wpch2ZMN/KkRPKlKvpXVfmAwmtdczr6vNYf14HfgE+AUuB94OOS4gsXPF5nQshmdZq7ffF0NeQj/wPNvP5JGKoO+Au4GHbHeqMncO1lkS53Ap3QDO93TrgGnPZxTRVwCvgSOFBSfKHc5/W2eDbr9TmdrE43GnmafIfm5v6L6m4DoAe6T+iLQmSKPvogUBgAA6OGdUwPkLmljCmzJnYDJqAZ94aQZDrRAPzo45pq4ASaP/8E+Lik+MIlj9fZEvFiVm3u9kDUwG7mkBMh0e15iqjNaHKivLAGNaVAP9TpgP5kk8n96TE+5zoyC7i+SdZugTr0hPRGwDYfxz8APCikHtY1TW2Qra7Miv1GFVLPIOrcqZOvSXQNY9GMehuQF2S+1sfU0zRebyNXzGrWqE7TdSWsQfpNQEsx3ARQjjZX/NU+OhxuQt0JMCJ6fCYwPJqhdvtjTG+uGVWv0Tw0Z9Z6jcrI0R9zcjYNFOWcw7T5kyDmxn0c+MDHdcVoUVm/Y3wD2sPh1Wgdoh30FIW3OYETP6HNF7+PPtb5OKY9Vc01quvzTQvLeBrVrFF/j8prSRrVP/1QGyUzmq4uA9vQHP4xtHTDQHSjMq+5ZjTn1Jw0qpNGjTxOwzXXqN9E+7IXrReKGlMd7cd+4Hza/DXBuBXNoLeiqXs/OjXHjKCVQ9KoicvXaM3yH6NPyHqhENOiDejRgkj0RaCWZDnQLuLHrN5lqJI0arpxxadZ34u+AONC68nAMx5TfOoJw6xl0TJoVDmRNGqkuYR5nLzF/EqfJDXKM9oTlllbIkOVNGvkGYz64K6ZNNl0z5Mjx6zHo//05a2Y004zLaATpYZHYkrSnHjUw3ETghgTeFgEyp3yQTFrGe5yVElbkaFvSfMG8DHqjMJHsZbV9EmQs4FOLkckqcKDGO/vWNQthbegRQJi/uQGZdYT0X+6zrpkmtJSxSFo06d6xqLF+2Nql6GYtQx1Nk6mV5LmyXjU6chk1E3yYmJYP2Y9hrm5aFc8pKY0DbSFmMmoBs4hmEZpgmBfs6otVMmQNM2Vu1FnYMcSsKzNj1ntW6hOA22tkqSB0DQtBdXAfoNnAxu1l+N+Z9YytA1U9WQSDZ2Utj5J8lJ92fh7XACjei2z9Hu7jDLUNj/9CXbrbEmbYqCaZj0X/acvKUqzlqIaNWjTvEkzc6Ca1RyH1b+TNCdJPBgG/E+tLw1K07AUrUFYj58GtEnS3LiEOrXtWsGWo9asBmtWPe+VNGqSqKh15f7M+g/gL88VpKTvJc2ZcVgXYC5Dje7l+zTreaw16/eEuD9rkmaBWnfeqkNmSXRkF+pyFbPGUHdgH2qfCkNds3qF9chGpb1tYnydV9W9OjVlcNdG2HHc8NJbWCO4Cb59QBL19iWs2wbm21j3xXZzL34Qd0F9Fe9RcwcWo+5PdQnrHauzMVRGkkQDtTXrZgRQXxd3WP03tPXQzPQKdWu3sM2abJpBmwL1YqVz+aXX6sJiLusyqQw/K0nWcRBr9GwRQSuDmvUE6tRrvtXVJQmMLSgN2OpRNUlKQJqGPVi7G4wl5jHrONS5Vn3Ry1nJFlwD22B0+B8gBz36mBRnV/Eo+K8VjCvQy7Xq5N9JcnqSFMdRzPdEkLXXXt8MQzXOmWR0IKHMegnrrqvmHjJJ1Lhv2OvqVrRcnKQNYL4Fv/Eo2q91rfpYq36OkEZtI5gb+V2wqbHVpTr6V5J72gb6z9KnJNsERXHWnC3n9WWg0xJNLh7F9Cw5SeKDoGkvb//oU5JtgpZWt+ruR8k2gN/lm0lSFkFbZrWGnk+hboCnT0m2CVpS3Vo4pCmGTbYJ2rK6ddtTcQbrvlTJNkFLqlvtpUjSs9JGkOrW4Ji11LT5nJ4D6DXxRhpVrfvRqVPNl56V4aU0pOnXuA8/61OfQl0y1aTZjXR+WUPXRvwsTWn+9Wvy3fkwgmQLruTI0atQ1wnoUYCT0f9GbCjCT+sZyTaAXQS4N4L1PCS1vGkznMAadJqMNnUa8e4k561Kp1vDJuK79Ztv2qVLrJ0B/NQu9cw+4MiU3uYBnzxrzuXtfUrSNjhJrH2PujBaUl3IUVbfSJK0KGSjMD48BrMPCXYVRx5Js3RNSI1CsJB1F3o0wN/CGEmSpPxGkszgBu3Sy2QbIDfOF0lxXGd3cRavHYbXKVdfS9IssevKnWhrWcwbMoRMNrG37iQpgbnMHCPGLWdL0TaPM+dZnZIpuCTNgkHR79fNsb5xNGEOw/XEvPJ/AEL3KNbpV9lCSxIPzBEzVy8Ug/CzqZ83CrCGTvJIBveTNAfMkbLPvB6V8KhZC7FeexlBFniQJE4YFzibuWW4r+xTvFHXrBPQpK72/VmTLbTmilpHGpTxFSXWRq05MIAYDxWKvffT8ePeRqaKL6Wk+RHo2TdJQvA2luUyDbW+7PgYtIaR19sPi1vFQW6hmj7YGygYGsZCOUlMUevKfF9GFTRLsx5Dfc+lTGKn4JI0i1pX2g4l6ojoxbxPHTSvLFQ4xLSI0MzFZGSgOaEmI7VPHRFiElbv2l1UUU+iu97FiQNYH6BsBiRpCoZg7fP7wbDwHsCkaMW5PvY+xnwZGTYNiEocxzqC7i2qKEl82YBmIj9GFWJ+hkGLnhYw+KDXm2Y9hrpPa3/i3d9LU9l2ydnQkKaXH7cMQ90wAzQjjEEzBGgZrJyAHZEAGKQv27RWy1H7WNjCz5I0TcwQNBeXR32MOY0qxPx8P2btj7rHFUQeJNDdw7lI6kFt2+ubGShvTM5bIqDXNGsZaqzLqVlokpTCHAE4z4hRBU1U4LTZ7P1ITxsXbACrrw9a75JthH7A21j7+T6jGFXQpAZrGdYtvvXcqzRrEp1c1F3gFpDWaxVeYg+qC+8t91aaVTLRbk86BG0zyxHEKHfVHsxqVYZJTZjGG7qFcE2SsHBKjfmZuzKqoMkzZmNo/QNKs6Y1J7H2dY3+RvKhZnHBLszRgf4B60hakg5Y+9q2JU7kHMOOWcuw5lr1Tdj0RUlv+mDt6wNOKw77YdVCzSl+a04lsK9wdE1/bRKMQagLlTFJU1Ky+h6Eo5vfzCt+DnOfbC1KkuYYRNpYcxR1gVIB8LKX4/1ThrqS5Bb05QJpSmFnp9z6MJ4nJkbVaWnN+j3q0P4W0eSSCUZvtE0Jdkfb71q8xFrNNOvfaSzVTWdaYtRStISLs1HT3qwdSJ+tZuPNRVOLVJ32ZlV/sECZdJrOJq0DTpCGRtVpblS1d9TzqK+VJC0xw2gxNUb1GncxaL85+7XNmTLUpSxm8u2ub+tMwNrXJ5sTns80a9Q7gLWvh6Wz9JbicCsKM0OQD9zZjAclwqDdXjtSaM/DFvuNqtMSGbNJnbIJkSIk07QHs+qJFfOCpcJ0lbYs8hI5apU/YdFuVJ1kGiDRyYr6PG+gTSHvgFi6b8e7WQU5TjOpA+b7rsd5XZGMCbEk1MUjkU3jJ7E+rzuCG1X7Q1bH4Iw0qy8yCHbfjQ9QY6UvYE2UpiVSs1olcjuKZPZ5u3LUcyqhDlLTBTtmdRvwSXfpLYeUGBCdkUFDzqNGAGIWAYgHTd1BRPbFjScjomm1IyHLdKMBGRNiWwZPRO5D/JTj7MTpYSSDPKnlKZc5D6uP7UJWnTStbq0gHKMmG/kEo5P2GJsQDKQmZLVbsjDtlhS2S8xGzaRpD3Qrmgw8gdW8Qc0a7+rWuC+7CED6V7dWeuxHLRdIoMHlQ8s+IYYlEfHgNeKYmEqCGjUlx3z0nrcL+ZxbJKcjBQlRkDETL69JsPK3GtT8sxsjJ4FdvVGjpcqbm2RqC2QR4jxmAnKSOEthE6xB6t4OJXHQDGzUaJkjb3gvqQ4YDOQnQMdaQg+0BGxcyYkzA5NmfeRxOW6rGQdF5Y1O0k9ImPK2kX9UTklTYczbSvoA/YLWhE+yCFcScw20VbInQixr2yK5mDcaKCJ9zDogacpgi/g6CcnEa0JwL9ZWYRKQk5jXF6HG+pJmVe+OLpJtvk6oxWOauKNTCt2UFUWI4VQlKjpzkkl8MyjkpVXtjSTtjXGokqL2zjicVt2Wocav5gYt0E5S45UBQQu0OUna+oqfVJjASWQfg/+YX2mS/iSPeSXxRtLAnimI5qx3SZrVLFTNRd0e6Dbi1xkpQWl7RELSqO0ReXvO+MXuXnR6KNWtOF0HXuZvk7QbpFHbL/aQa3tpFJbv0g1l+DJqO8GrUftLrg/iOWPtFQEmBj5o5MBXyGYNiPPo/I7PbJ65pxcM/ZZSRP9Kp7EGNcnk+sWCy9RyxZ4MtDL2NKrF0zR3s5ahLlgSotWN5KXYtQzZQksCzUPfwUVRDTu0PZrVqYW2C+aQYUna3hA3apZX85UyeVZr1GAAFrMqK4QN9LWrJtpVhkxnTI27IEVZ+dlYNRQlxXEwekF/+wdNnilGDaZK4of5nuglRcE0Kp7MWoYWLy2EhqTxRdTFIkWYGou7MGe0xFiaFZKGbYtYNTNLsO8Xc8yUq1eFB8qcZLYyakbyHO0PNyOl5VU3jRfJLGUoeVYZXUh+uM0L9WSf13ZnVuhRVe/EarAykmG36wNsrxs0YSCNGivSxKjgx6y6zHtJ8i5BEhcSz6jgzqywBVx3lZDTr0kaJxGNCrH7YpM0aZKElbvWU8trMXdFzR+YCgxDJnaSeFaKlr1LiLGpII0JfppViOm71F0oZHIrSXyoRt0ZJCEzAPqtF5G3DBGR2kpLpfojPZtXJyGboua3/O7Ax++1e1LXzANyiYb80gyTqGVrpVg3LdFZ6OHaSMhpzYhIkzgMxVj9nXDEJXgQV0+rsXD0rOHAgxBtxpdmTVKHOsG3BdiRiFOMdsQ92N36UxV6B6VRkxgpxxz6TYOxqXjTqrG+e/Qxe6J9vA9tJ9U8oEMaNC7JmHLSZ9fU6n0MQtcwPQ/L63LbHv8DuoTXieRJCTgAAAAASUVORK5CYII=" alt="ArtHub Logo" class="logo">
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
