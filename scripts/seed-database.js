import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { mockData } from './mock-data.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log(chalk.green('✅ Connected to MongoDB'));
  } catch (error) {
    console.error(chalk.red('❌ MongoDB connection failed:'), error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    console.log(chalk.yellow('🗑️  Clearing existing data...'));
    
    const collections = [
      'categories',
      'users',
      'artworks',
      'reviews',
      'follows',
      'chats',
      'messages',
      'notifications',
      'reports',
      'specialrequests',
      'transactions',
      'tokens'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(chalk.green(`✅ Cleared ${collectionName}`));
      } catch (error) {
        console.log(chalk.blue(`ℹ️  ${collectionName} collection doesn't exist or is empty`));
      }
    }
    
    console.log(chalk.green('✅ Database cleared successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Error clearing database:'), error.message);
    throw error;
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    console.log(chalk.blue('\n📂 Seeding categories...'));
    
    const categories = mockData.categories;
    await mongoose.connection.db.collection('categories').insertMany(categories);
    
    console.log(chalk.green(`✅ Seeded ${categories.length} categories`));
    return categories;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding categories:'), error.message);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    console.log(chalk.blue('\n👥 Seeding users...'));
    
    const users = mockData.users;
    await mongoose.connection.db.collection('users').insertMany(users);
    
    console.log(chalk.green(`✅ Seeded ${users.length} users`));
    return users;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding users:'), error.message);
    throw error;
  }
};

// Seed artworks
const seedArtworks = async () => {
  try {
    console.log(chalk.blue('\n🎨 Seeding artworks...'));
    
    const artworks = mockData.artworks;
    await mongoose.connection.db.collection('artworks').insertMany(artworks);
    
    console.log(chalk.green(`✅ Seeded ${artworks.length} artworks`));
    return artworks;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding artworks:'), error.message);
    throw error;
  }
};

// Seed reviews
const seedReviews = async () => {
  try {
    console.log(chalk.blue('\n⭐ Seeding reviews...'));
    
    const reviews = mockData.reviews;
    await mongoose.connection.db.collection('reviews').insertMany(reviews);
    
    console.log(chalk.green(`✅ Seeded ${reviews.length} reviews`));
    return reviews;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding reviews:'), error.message);
    throw error;
  }
};

// Seed follows
const seedFollows = async () => {
  try {
    console.log(chalk.blue('\n👥 Seeding follows...'));
    
    const follows = mockData.follows;
    await mongoose.connection.db.collection('follows').insertMany(follows);
    
    console.log(chalk.green(`✅ Seeded ${follows.length} follows`));
    return follows;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding follows:'), error.message);
    throw error;
  }
};

// Seed chats
const seedChats = async () => {
  try {
    console.log(chalk.blue('\n💬 Seeding chats...'));
    
    const chats = mockData.chats;
    await mongoose.connection.db.collection('chats').insertMany(chats);
    
    console.log(chalk.green(`✅ Seeded ${chats.length} chats`));
    return chats;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding chats:'), error.message);
    throw error;
  }
};

// Seed messages
const seedMessages = async () => {
  try {
    console.log(chalk.blue('\n💭 Seeding messages...'));
    
    const messages = mockData.messages;
    await mongoose.connection.db.collection('messages').insertMany(messages);
    
    console.log(chalk.green(`✅ Seeded ${messages.length} messages`));
    return messages;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding messages:'), error.message);
    throw error;
  }
};

// Seed notifications
const seedNotifications = async () => {
  try {
    console.log(chalk.blue('\n🔔 Seeding notifications...'));
    
    const notifications = mockData.notifications;
    await mongoose.connection.db.collection('notifications').insertMany(notifications);
    
    console.log(chalk.green(`✅ Seeded ${notifications.length} notifications`));
    return notifications;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding notifications:'), error.message);
    throw error;
  }
};

// Seed reports
const seedReports = async () => {
  try {
    console.log(chalk.blue('\n🚨 Seeding reports...'));
    
    const reports = mockData.reports;
    await mongoose.connection.db.collection('reports').insertMany(reports);
    
    console.log(chalk.green(`✅ Seeded ${reports.length} reports`));
    return reports;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding reports:'), error.message);
    throw error;
  }
};

// Seed special requests
const seedSpecialRequests = async () => {
  try {
    console.log(chalk.blue('\n📝 Seeding special requests...'));
    
    const specialRequests = mockData.specialRequests;
    await mongoose.connection.db.collection('specialrequests').insertMany(specialRequests);
    
    console.log(chalk.green(`✅ Seeded ${specialRequests.length} special requests`));
    return specialRequests;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding special requests:'), error.message);
    throw error;
  }
};

// Seed transactions
const seedTransactions = async () => {
  try {
    console.log(chalk.blue('\n💰 Seeding transactions...'));
    
    const transactions = mockData.transactions;
    await mongoose.connection.db.collection('transactions').insertMany(transactions);
    
    console.log(chalk.green(`✅ Seeded ${transactions.length} transactions`));
    return transactions;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding transactions:'), error.message);
    throw error;
  }
};

// Seed tokens
const seedTokens = async () => {
  try {
    console.log(chalk.blue('\n🔑 Seeding tokens...'));
    
    const tokens = mockData.tokens;
    await mongoose.connection.db.collection('tokens').insertMany(tokens);
    
    console.log(chalk.green(`✅ Seeded ${tokens.length} tokens`));
    return tokens;
  } catch (error) {
    console.error(chalk.red('❌ Error seeding tokens:'), error.message);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log(chalk.blue('🌱 Starting database seeding...\n'));
    
    // Clear existing data
    await clearDatabase();
    
    // Seed all collections
    await seedCategories();
    await seedUsers();
    await seedArtworks();
    await seedReviews();
    await seedFollows();
    await seedChats();
    await seedMessages();
    await seedNotifications();
    await seedReports();
    await seedSpecialRequests();
    await seedTransactions();
    await seedTokens();
    
    console.log(chalk.green('\n🎉 Database seeding completed successfully!'));
    console.log(chalk.blue('\n📊 Summary:'));
    console.log(chalk.cyan(`   - Categories: ${mockData.categories.length}`));
    console.log(chalk.cyan(`   - Users: ${mockData.users.length}`));
    console.log(chalk.cyan(`   - Artworks: ${mockData.artworks.length}`));
    console.log(chalk.cyan(`   - Reviews: ${mockData.reviews.length}`));
    console.log(chalk.cyan(`   - Follows: ${mockData.follows.length}`));
    console.log(chalk.cyan(`   - Chats: ${mockData.chats.length}`));
    console.log(chalk.cyan(`   - Messages: ${mockData.messages.length}`));
    console.log(chalk.cyan(`   - Notifications: ${mockData.notifications.length}`));
    console.log(chalk.cyan(`   - Reports: ${mockData.reports.length}`));
    console.log(chalk.cyan(`   - Special Requests: ${mockData.specialRequests.length}`));
    console.log(chalk.cyan(`   - Transactions: ${mockData.transactions.length}`));
    console.log(chalk.cyan(`   - Tokens: ${mockData.tokens.length}`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Database seeding failed:'), error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedDatabase();
    await mongoose.disconnect();
    console.log(chalk.green('\n👋 Disconnected from MongoDB'));
  } catch (error) {
    console.error(chalk.red('\n❌ Seeding failed:'), error.message);
    process.exit(1);
  }
};

// Run the script
main(); 