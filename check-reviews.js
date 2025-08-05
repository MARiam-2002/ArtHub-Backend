import mongoose from 'mongoose';
import Review from './DB/models/review.model.js';

async function checkReviews() {
  try {
    await mongoose.connect('mongodb://localhost:27017/arthub');
    console.log('Connected to MongoDB');
    
    const artistId = '6872b83044e2488629f74e8a';
    
    // Check reviews for this artist
    const artistReviews = await Review.find({ artist: artistId }).limit(3);
    console.log('\n=== Reviews for Artist ===');
    console.log('Count:', artistReviews.length);
    artistReviews.forEach((review, index) => {
      console.log(`\nReview ${index + 1}:`);
      console.log('- ID:', review._id);
      console.log('- User:', review.user);
      console.log('- Artist:', review.artist);
      console.log('- Artwork:', review.artwork);
      console.log('- Rating:', review.rating);
      console.log('- Comment:', review.comment);
    });
    
    // Check if there are any reviews without artwork (pure artist reviews)
    const pureArtistReviews = await Review.find({ 
      artist: artistId, 
      artwork: { $exists: false } 
    }).limit(3);
    
    console.log('\n=== Pure Artist Reviews (no artwork) ===');
    console.log('Count:', pureArtistReviews.length);
    
    // Check total reviews for this artist
    const totalArtistReviews = await Review.countDocuments({ artist: artistId });
    console.log('\n=== Total Reviews for Artist ===');
    console.log('Count:', totalArtistReviews);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkReviews(); 