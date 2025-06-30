import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

// سيستخدم لتخزين مثيل خادم MongoDB في الذاكرة
let mongoServer;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000; // 3 seconds

// Cache the database connection
let cachedConnection = null;

export const connectDB = async (retryCount = 0) => {
  // If we already have a connection, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    // نهج مختلف للاتصال بناءً على البيئة
    if (process.env.NODE_ENV === "production") {
      // بيئة الإنتاج: استخدام URL الاتصال من المتغيرات البيئية
      if (!process.env.CONNECTION_URL) {
        console.error("Missing CONNECTION_URL environment variable in production");
        return Promise.reject(new Error("Missing CONNECTION_URL in production"));
      }

      // Check if connection string contains placeholders that weren't replaced
      if (process.env.CONNECTION_URL.includes('your_username') || 
          process.env.CONNECTION_URL.includes('your_password') || 
          process.env.CONNECTION_URL.includes('your_cluster')) {
        console.error("⚠️ MongoDB connection string contains placeholder values. Please update with actual credentials.");
        return Promise.reject(new Error("MongoDB connection string contains placeholders"));
      }

      console.log("Connecting to production MongoDB...");
      
      // Serverless-optimized connection options
      const options = {
        serverSelectionTimeoutMS: 5000, // Reduced for serverless
        socketTimeoutMS: 30000,
        maxPoolSize: 5, // Reduced for serverless
        minPoolSize: 1, // Ensure at least one connection
        connectTimeoutMS: 5000, // Reduced for serverless
        bufferCommands: true,
        bufferTimeoutMS: 10000, // Reduced for serverless
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      
      // For Vercel serverless, we need to handle connection differently
      if (process.env.VERCEL) {
        console.log("Running in Vercel environment, using optimized connection");
        // Don't wait for DNS seedlist discovery
        options.directConnection = true;
      }
      
      await mongoose.connect(process.env.CONNECTION_URL, options);
    } else {
      // بيئة التطوير: استخدام mongodb-memory-server إذا لم يتم توفير URL الاتصال
      if (!process.env.CONNECTION_URL) {
        console.log("No CONNECTION_URL provided, using in-memory MongoDB instance");
        
        // إنشاء قاعدة بيانات في الذاكرة إذا لم تكن موجودة
        if (!mongoServer) {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          console.log(`In-memory MongoDB server started at ${mongoUri}`);
          
          // تعيين URL الاتصال للاستخدام لاحقًا
          process.env.CONNECTION_URL = mongoUri;
        }
        
        // الاتصال بقاعدة البيانات في الذاكرة
        await mongoose.connect(process.env.CONNECTION_URL, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          bufferCommands: true,
          bufferTimeoutMS: 30000,
        });
      } else {
        // استخدام URL الاتصال من المتغيرات البيئية لبيئة التطوير
        console.log("Connecting to development MongoDB with provided URL...");
        await mongoose.connect(process.env.CONNECTION_URL, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          bufferCommands: true,
          bufferTimeoutMS: 30000,
        });
      }
    }

    console.log("✅ MongoDB connected successfully!");
    cachedConnection = mongoose.connection;
    return cachedConnection;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    
    // More helpful error messaging based on common MongoDB connection issues
    if (error.name === 'MongoServerSelectionError') {
      console.error("⚠️ Could not connect to MongoDB server. Please check:");
      console.error("  - MongoDB server is running and accessible");
      console.error("  - Connection URL is correct including username, password, and cluster name");
      console.error("  - Network allows connection to MongoDB (check firewall/security groups)");
    } else if (error.name === 'MongoParseError') {
      console.error("⚠️ Invalid MongoDB connection string format. Please check your CONNECTION_URL.");
    } else if (error.message.includes('Authentication failed')) {
      console.error("⚠️ MongoDB authentication failed. Please check your username and password.");
    } else if (error.message.includes('ENOTFOUND')) {
      console.error("⚠️ Could not resolve MongoDB host. Please check your cluster address.");
    }
    
    // Implement retry mechanism
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_INTERVAL/1000} seconds... (Attempt ${retryCount + 1} of ${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectDB(retryCount + 1);
    }
    
    if (process.env.NODE_ENV === "production") {
      // في الإنتاج، ببساطة نرفض الوعد بالخطأ
      return Promise.reject(error);
    } else {
      // في التطوير، يمكننا إعادة المحاولة أو إرجاع معلومات خطأ أكثر تفصيلاً
      console.error("Try checking if your MongoDB connection string is correct or use in-memory database");
      return Promise.reject(error);
    }
  }
};

// دالة للإغلاق عند إيقاف التطبيق
export const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) { // Check if connection is active
      if (mongoServer) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        mongoServer = null;
        console.log("✅ In-memory MongoDB server stopped successfully");
      } else {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed successfully");
      }
      cachedConnection = null;
    }
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
};
