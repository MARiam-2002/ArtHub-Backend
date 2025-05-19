
import cors from 'cors';

export const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://art-hub-backend.vercel.app',
      'https://art-hub-frontend.vercel.app', // Add your frontend URL
      'https://arthub-app.com', // Add your production domain if any
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default cors(corsOptions);
