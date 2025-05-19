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
dotenv.config();
import jwt from "jsonwebtoken";

export const bootstrap = (app, express) => {
  if (process.env.NODE_ENV == "dev") {
    app.use(morgan("common"));
  }

  // Apply CORS middleware globally
  app.use(corsMiddleware);

  // Enable pre-flight across all routes
  app.options('*', corsMiddleware);

  // Use Express JSON to parse data
  app.use(express.json());

  // JWT authentication middleware
  app.use((req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1]; 
    if (token) {
      jwt.verify(token, process.env.TOKEN_KEY, (err, decoded) => {
        if (err) {
          return res.status(403).json({ success: false, message: "Invalid token" });
        }
        req.user = decoded; // Add user data from token to request
        next();
      });
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
  app.use("/api-docs", (req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, swaggerRoutes);

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
 
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.success({
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }, 'API is running properly');
  });

  // 404 handler
  app.all("*", (req, res, next) => {
    return next(new Error("not found page", { cause: 404 }));
  });

  // Global error handler
  app.use(errorHandler);
};
