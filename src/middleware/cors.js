import cors from 'cors';

export const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://art-hub-backend.vercel.app',
      'https://art-hub-frontend.vercel.app',
      'https://arthub-api.vercel.app',
      'https://arthub-app.com',
      'https://app.arthub-app.com',
      'capacitor://localhost', // For Capacitor/Ionic apps
      'ionic://localhost',     // For Ionic apps
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
      ...((process.env.NODE_ENV !== 'production') ? [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:8000',
        'http://localhost:8100', // Ionic default
        'http://localhost:19000', // Expo default
        'http://localhost:19002', // Expo DevTools
        'http://localhost:19006' // Expo web
      ] : [])
    ];
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // In development, log the origin for debugging purposes
    if (isDevelopment) {
      console.log(`CORS request from origin: ${origin}`);
    }
    
    // Allow all origins in development mode (if specifically enabled)
    if (isDevelopment && process.env.CORS_ALLOW_ALL === 'true') {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowedOrigin => {
      // Support for wildcard subdomains (e.g., '*.arthub-app.com')
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain) && origin.includes('.');
      }
      return allowedOrigin === origin;
    })) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'X-Api-Key', 
    'X-Auth-Token',
    'X-Device-ID',
    'X-App-Version'
  ],
  exposedHeaders: [
    'Content-Disposition', 
    'X-Rate-Limit', 
    'X-Rate-Limit-Remaining'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours cache for preflight requests
};

export default cors(corsOptions);
