import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

// سيستخدم لتخزين مثيل خادم MongoDB في الذاكرة
let mongoServer;

export const connectDB = async () => {
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
      await mongoose.connect(process.env.CONNECTION_URL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        connectTimeoutMS: 10000,
      });
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
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
      } else {
        // استخدام URL الاتصال من المتغيرات البيئية لبيئة التطوير
        console.log("Connecting to development MongoDB with provided URL...");
        await mongoose.connect(process.env.CONNECTION_URL, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
      }
    }

    console.log("✅ MongoDB connected successfully!");
    return mongoose.connection;
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
    }
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
};
