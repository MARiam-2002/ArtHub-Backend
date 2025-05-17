
import express from "express";
import dotenv from "dotenv";
import { bootstrap } from "./src/index.router.js";
import { connectDB } from "./DB/connection.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Initialize routes and middleware
bootstrap(app, express);

// Base API route
app.get("/api", (req, res) => res.send("ArtHub API is running!"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Start the server
app.listen(port, () => console.log(`ArtHub server running on port ${port}!`));
