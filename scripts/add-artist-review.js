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

async function addArtistReview() {
  try {
    await connectDB();
    
    // Test data - using the same user and artist from the artwork
    const userId = '68767bdfd35ce669866a2236';
    const artworkId = '6872b84944e2488629f74f0f';
    
    console.log('🔍 Getting artwork to find artist...');
    
    // Get artwork to find the artist
    const artwork = await artworkModel.findById(artworkId);
    if (!artwork) {
      console.error('❌ Artwork not found');
      return;
    }
    
    const artistId = artwork.artist;
    console.log('✅ Artist ID:', artistId);
    
    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    console.log('✅ User found:', user.displayName);
    
    // Check if user already reviewed this artist
    const existingReview = await reviewModel.findOne({
      user: userId,
      artist: artistId,
      artwork: { $exists: false } // Artist review, not artwork review
    });
    
    if (existingReview) {
      console.log('⚠️ User already reviewed this artist');
      console.log('Review details:', {
        _id: existingReview._id,
        rating: existingReview.rating,
        comment: existingReview.comment,
        status: existingReview.status
      });
      return;
    }
    
    // Create new artist review
    const newReview = new reviewModel({
      user: userId,
      artist: artistId,
      rating: 5,
      comment: 'فنان ممتاز ومحترف جداً! أضيف هذا التقييم للاختبار.',
      title: 'تقييم الفنان',
      status: 'active',
      isVerifiedPurchase: false,
      anonymous: false,
      // Add analytics to avoid the save() issue
      analytics: {
        qualityScore: 85,
        helpfulVotes: 0,
        viewsCount: 0,
        sharesCount: 0
      }
    });
    
    await newReview.save();
    
    console.log('✅ Artist review added successfully!');
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
      .populate('artist', 'displayName')
      .lean();
    
    console.log('📋 Verification:');
    console.log('- User:', addedReview.user?.displayName);
    console.log('- Artist:', addedReview.artist?.displayName);
    console.log('- Rating:', addedReview.rating);
    console.log('- Comment:', addedReview.comment);
    
    console.log('\n🎉 Now you can test the API endpoint:');
    console.log('GET /home/artwork/6872b84944e2488629f74f0f');
    console.log('The artistReviews field should now show the artist review details!');
    
  } catch (error) {
    console.error('❌ Error adding artist review:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addArtistReview(); 