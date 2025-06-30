import authRouter from "./modules/auth/auth.router.js";
import { globalErrorHandling } from "./utils/asyncHandler.js";
import corsMiddleware, { corsOptions } from "./middleware/cors.js";
import morgan from "morgan";
import dotenv from "dotenv";
import imageRouter from './modules/image/image.router.js';
import chatRouter from './modules/chat/chat.router.js';
import { responseMiddleware } from './middleware/response.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import artworkRouter from './modules/artwork/artwork.router.js';
import homeRouter from './modules/home/home.router.js';
import swaggerRoutes from './swagger/swagger.js';
import termsRouter from './modules/global/terms.router.js';
import specialRequestRouter from './modules/specialRequest/specialRequest.router.js';
import reportRouter from './modules/report/report.router.js';
import transactionRouter from './modules/transaction/transaction.router.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
dotenv.config();
import jwt from "jsonwebtoken";
import reviewRouter from './modules/review/review.router.js';
import followRouter from './modules/follow/follow.router.js';
import notificationRouter from './modules/notification/notification.router.js';
import mongoose from 'mongoose';

export const bootstrap = (app, express) => {
  if (process.env.NODE_ENV == "dev") {
    app.use(morgan("common"));
  }

  // Apply simple CORS middleware for all environments
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));

  // Use Express JSON to parse data
  app.use(express.json());

  // JWT authentication middleware
  app.use((req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; 
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded; // Add user data from token to request
        next();
      } catch (error) {
        // Don't return error, just continue without user
        next();
      }
    } else {
      next();
    }
  });

  // Response enhancer middleware
  app.use(responseMiddleware);

  // إعداد متغيرات المسار للـ ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // خدمة الملفات الثابتة من مجلد public
  app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

  // 1. خدمة ملفات swagger.json و swagger.yaml كـ static قبل swaggerRoutes
  app.use('/api-docs/swagger.json', express.static(path.join(__dirname, 'swagger', 'swagger.json')));
  app.use('/api-docs/swagger.yaml', express.static(path.join(__dirname, 'swagger', 'swagger.yaml')));

  // 2. راوتر Swagger UI (لا تغيره)
  app.use("/api-docs", swaggerRoutes);

  // API routes
  app.use("/api/auth", authRouter);
  app.use('/api/image', imageRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/artworks', artworkRouter);
  app.use('/api/home', homeRouter);
  app.use('/api/terms', termsRouter);
  app.use('/api/special-requests', specialRequestRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/follow', followRouter);
  app.use('/api/notifications', notificationRouter);
 
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.success({
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }, 'API is running properly');
  });

  // Add keepalive endpoint for preventing cold starts
  app.get("/keepalive", async (req, res) => {
    try {
      const isConnected = mongoose.connection.readyState === 1;
      
      if (isConnected) {
        res.status(200).json({
          status: 'ok',
          message: 'Server is alive',
          database: 'connected',
          timestamp: new Date().toISOString()
        });
      } else {
        // Try to reconnect
        try {
          await mongoose.connect(process.env.CONNECTION_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 5000,
            maxPoolSize: 5,
            minPoolSize: 1,
            bufferCommands: true,
            bufferTimeoutMS: 30000,
            directConnection: true
          });
          
          res.status(200).json({
            status: 'ok',
            message: 'Server is alive, reconnected to database',
            database: 'reconnected',
            timestamp: new Date().toISOString()
          });
        } catch (reconnectError) {
          res.status(503).json({
            status: 'degraded',
            message: 'Server is alive but database connection failed',
            database: 'disconnected',
            error: reconnectError.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error in keepalive endpoint:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error checking server status',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 404 handler
  app.all("*", (req, res, next) => {
    return next(new Error("not found page", { cause: 404 }));
  });

  // Global error handler
  app.use(errorHandler);
};
