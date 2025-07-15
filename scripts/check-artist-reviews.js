import mongoose from 'mongoose';
import reviewModel from '../DB/models/review.model.js';
import userModel from '../DB/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB using the same connection logic as the app
const connectDB = async () => {
  try {
    const connectionUrl = process.env.CONNECTION_URL;
    if (!connectionUrl) {
      throw new Error('CONNECTION_URL not found in environment variables');
    }
    
    await mongoose.connect(connectionUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

async function checkArtistReviews() {
  try {
    await connectDB();
    
    console.log('Checking artist reviews in database...');
    
    // Check artist reviews (reviews for artist, not artwork)
    const artistId = '6872b83044e2488629f74e8a'; // ليلى محمد الخطاطة
    const artistReviews = await reviewModel.find({ 
      artist: artistId, 
      status: 'active',
      artwork: { $exists: false } // Only artist reviews, not artwork reviews
    }).populate('user', 'displayName').lean();
    
    console.log('Artist reviews count:', artistReviews.length);
    
    if (artistReviews.length > 0) {
      console.log('Artist reviews found:');
      artistReviews.forEach((review, index) => {
        console.log(`${index + 1}. User: ${review.user?.displayName}, Rating: ${review.rating}, Comment: ${review.comment}`);
      });
    } else {
      console.log('No artist reviews found');
    }
    
    // Check all reviews for this artist (including artwork reviews)
    const allArtistReviews = await reviewModel.find({ 
      artist: artistId, 
      status: 'active'
    }).lean();
    
    console.log('Total reviews for artist (including artwork reviews):', allArtistReviews.length);
    
    // Check if there are any reviews with artwork field
    const artworkReviews = allArtistReviews.filter(r => r.artwork);
    const pureArtistReviews = allArtistReviews.filter(r => !r.artwork);
    
    console.log('Artwork reviews for this artist:', artworkReviews.length);
    console.log('Pure artist reviews (no artwork):', pureArtistReviews.length);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkArtistReviews(); 