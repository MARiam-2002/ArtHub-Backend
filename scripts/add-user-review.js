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

async function addUserReview() {
  try {
    await connectDB();
    
    // Test data
    const userId = '68767bdfd35ce669866a2236';
    const artworkId = '6872b84944e2488629f74f0f';
    
    console.log('🔍 Checking if user and artwork exist...');
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    console.log('✅ User found:', user.displayName);
    
    // Check if artwork exists
    const artwork = await artworkModel.findById(artworkId);
    if (!artwork) {
      console.error('❌ Artwork not found');
      return;
    }
    console.log('✅ Artwork found:', artwork.title);
    
    // Check if user already reviewed this artwork
    const existingReview = await reviewModel.findOne({
      user: userId,
      artwork: artworkId
    });
    
    if (existingReview) {
      console.log('⚠️ User already reviewed this artwork');
      console.log('Review details:', {
        _id: existingReview._id,
        rating: existingReview.rating,
        comment: existingReview.comment,
        status: existingReview.status
      });
      return;
    }
    
    // Create new review
    const newReview = new reviewModel({
      user: userId,
      artwork: artworkId,
      artist: artwork.artist,
      rating: 4,
      comment: 'عمل رائع جداً! أضيف هذا التقييم للاختبار.',
      title: 'تقييم تجريبي',
      status: 'active',
      isVerifiedPurchase: false,
      anonymous: false,
      // Add analytics to avoid the save() issue
      analytics: {
        qualityScore: 75,
        helpfulVotes: 0,
        viewsCount: 0,
        sharesCount: 0
      }
    });
    
    await newReview.save();
    
    console.log('✅ Review added successfully!');
    console.log('Review details:', {
      _id: newReview._id,
      rating: newReview.rating,
      comment: newReview.comment,
      status: newReview.status,
      createdAt: newReview.createdAt
    });
    
    // Verify the review was added
    const addedReview = await reviewModel.findById(newReview._id)
      .populate('user', 'displayName email')
      .populate('artwork', 'title')
      .lean();
    
    console.log('📋 Verification:');
    console.log('- User:', addedReview.user?.displayName);
    console.log('- Artwork:', addedReview.artwork?.title);
    console.log('- Rating:', addedReview.rating);
    console.log('- Comment:', addedReview.comment);
    
    console.log('\n🎉 Now you can test the API endpoint:');
    console.log('GET /home/artwork/6872b84944e2488629f74f0f');
    console.log('The userReview field should now show the review details!');
    
  } catch (error) {
    console.error('❌ Error adding review:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addUserReview(); 