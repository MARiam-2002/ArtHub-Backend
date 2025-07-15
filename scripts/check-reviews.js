import mongoose from 'mongoose';
import reviewModel from '../DB/models/review.model.js';
import userModel from '../DB/models/user.model.js';
import artworkModel from '../DB/models/artwork.model.js';
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

async function checkReviews() {
  try {
    await connectDB();
    console.log('Checking reviews in database...');
    
    // Check total reviews
    const totalReviews = await reviewModel.countDocuments();
    console.log('Total reviews:', totalReviews);
    
    // Check reviews for specific artwork
    const artworkId = '6872b84944e2488629f74f0f';
    const artworkReviews = await reviewModel.find({ artwork: artworkId });
    console.log('Reviews for artwork:', artworkReviews.length);
    
    // Check reviews for specific user
    const userId = '68767bdfd35ce669866a2236';
    const userReviews = await reviewModel.find({ user: userId });
    console.log('Reviews by user:', userReviews.length);
    
    // Check if user reviewed this specific artwork
    const userArtworkReview = await reviewModel.findOne({ 
      artwork: artworkId, 
      user: userId 
    });
    console.log('User review for this artwork:', userArtworkReview ? 'Found' : 'Not found');
    
    if (userArtworkReview) {
      console.log('Review details:', {
        _id: userArtworkReview._id,
        rating: userArtworkReview.rating,
        comment: userArtworkReview.comment,
        status: userArtworkReview.status
      });
    }
    
    // Check all reviews for this artwork
    const allArtworkReviews = await reviewModel.find({ artwork: artworkId })
      .populate('user', 'displayName email')
      .lean();
    
    console.log('All reviews for artwork:');
    allArtworkReviews.forEach((review, index) => {
      console.log(`${index + 1}. User: ${review.user?.displayName}, Rating: ${review.rating}, Status: ${review.status}`);
    });
    
  } catch (error) {
    console.error('Error checking reviews:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkReviews(); 