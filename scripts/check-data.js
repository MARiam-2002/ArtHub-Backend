import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

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

// Check data in collections
const checkData = async () => {
  try {
    console.log(chalk.blue('\n📊 Checking database collections...\n'));

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(chalk.cyan(`${collection.name}: ${count} documents`));
    }

    // Check specific collections with more details
    console.log(chalk.yellow('\n📋 Detailed Collection Information:'));
    
    // Users
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    const artistsCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'artist' });
    const regularUsersCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'user' });
    
    console.log(chalk.green(`👥 Users: ${usersCount} total`));
    console.log(chalk.blue(`   - Artists: ${artistsCount}`));
    console.log(chalk.blue(`   - Regular Users: ${regularUsersCount}`));

    // Categories
    const categoriesCount = await mongoose.connection.db.collection('categories').countDocuments();
    console.log(chalk.green(`📂 Categories: ${categoriesCount}`));

    // Artworks
    const artworksCount = await mongoose.connection.db.collection('artworks').countDocuments();
    const availableArtworks = await mongoose.connection.db.collection('artworks').countDocuments({ status: 'available' });
    const soldArtworks = await mongoose.connection.db.collection('artworks').countDocuments({ status: 'sold' });
    
    console.log(chalk.green(`🎨 Artworks: ${artworksCount} total`));
    console.log(chalk.blue(`   - Available: ${availableArtworks}`));
    console.log(chalk.blue(`   - Sold: ${soldArtworks}`));

    // Reviews
    const reviewsCount = await mongoose.connection.db.collection('reviews').countDocuments();
    console.log(chalk.green(`⭐ Reviews: ${reviewsCount}`));

    // Follows
    const followsCount = await mongoose.connection.db.collection('follows').countDocuments();
    console.log(chalk.green(`👥 Follows: ${followsCount}`));

    // Chats
    const chatsCount = await mongoose.connection.db.collection('chats').countDocuments();
    console.log(chalk.green(`💬 Chats: ${chatsCount}`));

    // Messages
    const messagesCount = await mongoose.connection.db.collection('messages').countDocuments();
    console.log(chalk.green(`💭 Messages: ${messagesCount}`));

    // Notifications
    const notificationsCount = await mongoose.connection.db.collection('notifications').countDocuments();
    console.log(chalk.green(`🔔 Notifications: ${notificationsCount}`));

    // Reports
    const reportsCount = await mongoose.connection.db.collection('reports').countDocuments();
    console.log(chalk.green(`🚨 Reports: ${reportsCount}`));

    // Special Requests
    const specialRequestsCount = await mongoose.connection.db.collection('specialrequests').countDocuments();
    console.log(chalk.green(`📝 Special Requests: ${specialRequestsCount}`));

    // Transactions
    const transactionsCount = await mongoose.connection.db.collection('transactions').countDocuments();
    console.log(chalk.green(`💰 Transactions: ${transactionsCount}`));

    // Tokens
    const tokensCount = await mongoose.connection.db.collection('tokens').countDocuments();
    console.log(chalk.green(`🔑 Tokens: ${tokensCount}`));

    console.log(chalk.green('\n✅ Database check completed successfully!'));

  } catch (error) {
    console.error(chalk.red('❌ Error checking data:'), error.message);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkData();
  await mongoose.disconnect();
  console.log(chalk.green('\n👋 Disconnected from MongoDB'));
};

// Run the script
main().catch(console.error); 