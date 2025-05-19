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

  // Set special headers for Swagger docs specifically
  app.use("/api-docs", (req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, swaggerRoutes);

  // API routes
  app.use("/auth", authRouter);
  app.use('/image', imageRouter);
  app.use('/chat', chatRouter);
  app.use('/artworks', artworkRouter);
  app.use('/home', homeRouter);
  app.use('/terms', termsRouter);
 
  // 404 handler
  app.all("*", (req, res, next) => {
    return next(new Error("not found page", { cause: 404 }));
  });

  // Global error handler
  app.use(errorHandler);
};
