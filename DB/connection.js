import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log("DB connected!");
  } catch (error) {
    console.error("Database connection error:", error.message);
    // For critical errors in production, you might want to exit
    if (process.env.NODE_ENV === "production") {
      console.error("Fatal: Could not connect to database. Exiting...");
      process.exit(1);
    }
  }
};
