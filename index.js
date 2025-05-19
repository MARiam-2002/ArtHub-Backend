import express from "express";
import dotenv from "dotenv";
import { bootstrap } from "./src/index.router.js";
import { connectDB } from "./DB/connection.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB()
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Initialize routes and middleware
bootstrap(app, express);

// Base API route
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "ArtHub API is running!",
    version: process.env.npm_package_version || "1.0.0",
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    status: "UP",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    const serverEnv = process.env.NODE_ENV || 'development';
    console.log(`
    ✅ ArtHub API Server Running!
    🌐 Environment: ${serverEnv}
    🚪 Port: ${port}
    📚 API Docs: http://localhost:${port}/api-docs
    ⏱️ Started at: ${new Date().toLocaleString()}
    `);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Graceful shutdown
    server.close(() => {
      console.log('🛑 Server closed due to uncaught exception');
      process.exit(1);
    });
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Continue running but log the error
  });
}

export default app;
