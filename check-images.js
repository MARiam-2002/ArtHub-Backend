import mongoose from 'mongoose';
import artworkModel from './DB/models/artwork.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/arthub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function checkImages() {
  try {
    await connectDB();
    
    const artworks = await artworkModel.find().select('title images').limit(5);
    
    console.log('\n📸 Sample Artworks Images:');
    artworks.forEach((artwork, index) => {
      console.log(`\n${index + 1}. ${artwork.title}:`);
      console.log('   Images:', artwork.images);
      console.log('   Images type:', typeof artwork.images);
      console.log('   Images length:', artwork.images?.length || 0);
      if (artwork.images && artwork.images.length > 0) {
        console.log('   First image type:', typeof artwork.images[0]);
        console.log('   First image:', artwork.images[0]);
      }
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkImages(); 