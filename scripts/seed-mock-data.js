import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { mockData } from './mock-data.js';

// Import models
import userModel from '../DB/models/user.model.js';
import categoryModel from '../DB/models/category.model.js';
import artworkModel from '../DB/models/artwork.model.js';
import reviewModel from '../DB/models/review.model.js';
import followModel from '../DB/models/follow.model.js';
import chatModel from '../DB/models/chat.model.js';
import messageModel from '../DB/models/message.model.js';
import notificationModel from '../DB/models/notification.model.js';
import specialRequestModel from '../DB/models/specialRequest.model.js';
import transactionModel from '../DB/models/transaction.model.js';
import reportModel from '../DB/models/report.model.js';
import tokenModel from '../DB/models/token.model.js';

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arthub');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Hash passwords for users
const hashPasswords = async (users) => {
  const hashedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      return {
        ...user,
        password: hashedPassword
      };
    })
  );
  return hashedUsers;
};

// Seed function
const seedData = async () => {
  try {
    console.log('🌱 Starting to seed mock data...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      userModel.deleteMany({}),
      categoryModel.deleteMany({}),
      artworkModel.deleteMany({}),
      reviewModel.deleteMany({}),
      followModel.deleteMany({}),
      chatModel.deleteMany({}),
      messageModel.deleteMany({}),
      notificationModel.deleteMany({}),
      specialRequestModel.deleteMany({}),
      transactionModel.deleteMany({}),
      reportModel.deleteMany({}),
      tokenModel.deleteMany({})
    ]);

    // Hash passwords for users
    console.log('🔐 Hashing passwords...');
    const hashedUsers = await hashPasswords(mockData.users);

    // Seed categories
    console.log('📂 Seeding categories...');
    const categories = await categoryModel.insertMany(mockData.categories);
    console.log(`✅ Created ${categories.length} categories`);

    // Seed users
    console.log('👥 Seeding users...');
    const users = await userModel.insertMany(hashedUsers);
    console.log(`✅ Created ${users.length} users`);

    // Seed artworks
    console.log('🎨 Seeding artworks...');
    const artworks = await artworkModel.insertMany(mockData.artworks);
    console.log(`✅ Created ${artworks.length} artworks`);

    // Seed reviews
    console.log('⭐ Seeding reviews...');
    const reviews = await reviewModel.insertMany(mockData.reviews);
    console.log(`✅ Created ${reviews.length} reviews`);

    // Seed follows
    console.log('👥 Seeding follows...');
    const follows = await followModel.insertMany(mockData.follows);
    console.log(`✅ Created ${follows.length} follows`);

    // Seed chats
    console.log('💬 Seeding chats...');
    const chats = await chatModel.insertMany(mockData.chats);
    console.log(`✅ Created ${chats.length} chats`);

    // Seed messages
    console.log('📨 Seeding messages...');
    const messages = await messageModel.insertMany(mockData.messages);
    console.log(`✅ Created ${messages.length} messages`);

    // Seed notifications
    console.log('🔔 Seeding notifications...');
    const notifications = await notificationModel.insertMany(mockData.notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Seed special requests
    console.log('📋 Seeding special requests...');
    const specialRequests = await specialRequestModel.insertMany(mockData.specialRequests);
    console.log(`✅ Created ${specialRequests.length} special requests`);

    // Seed transactions
    console.log('💰 Seeding transactions...');
    const transactions = await transactionModel.insertMany(mockData.transactions);
    console.log(`✅ Created ${transactions.length} transactions`);

    // Seed reports
    console.log('🚨 Seeding reports...');
    const reports = await reportModel.insertMany(mockData.reports);
    console.log(`✅ Created ${reports.length} reports`);

    // Seed tokens
    console.log('🔑 Seeding tokens...');
    const tokens = await tokenModel.insertMany(mockData.tokens);
    console.log(`✅ Created ${tokens.length} tokens`);

    console.log('🎉 Mock data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Artworks: ${artworks.length}`);
    console.log(`- Reviews: ${reviews.length}`);
    console.log(`- Follows: ${follows.length}`);
    console.log(`- Chats: ${chats.length}`);
    console.log(`- Messages: ${messages.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log(`- Special Requests: ${specialRequests.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Reports: ${reports.length}`);
    console.log(`- Tokens: ${tokens.length}`);

    console.log('\n🔑 Test Accounts:');
    console.log('Artist: ahmed.artist@example.com / password123');
    console.log('User: mohammed.user@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  connectDB()
    .then(() => seedData())
    .then(() => {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData }; 