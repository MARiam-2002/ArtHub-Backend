import mongoose from 'mongoose';

async function quickTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arthub');
    console.log('Connected to database');
    
    const userId = '6872c6eb501ee86cc3c5b77c';
    
    // Import models
    const specialRequestModel = (await import('../DB/models/specialRequest.model.js')).default;
    const reviewModel = (await import('../DB/models/review.model.js')).default;
    
    // Test basic queries
    const requests = await specialRequestModel.find({ user: userId });
    console.log('Requests for user:', requests.length);
    
    const reviews = await reviewModel.find({ user: userId });
    console.log('Reviews for user:', reviews.length);
    
    if (requests.length > 0) {
      console.log('Sample request:', {
        status: requests[0].status,
        budget: requests[0].budget,
        finalPrice: requests[0].finalPrice,
        requestType: requests[0].requestType
      });
    }
    
    if (reviews.length > 0) {
      console.log('Sample review:', {
        rating: reviews[0].rating,
        createdAt: reviews[0].createdAt
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest(); 