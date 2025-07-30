import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugSpecificUser() {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('Connected to database');
    
    const userId = '6872c6eb501ee86cc3c5b77c';
    
    // Import models
    const specialRequestModel = (await import('../DB/models/specialRequest.model.js')).default;
    const reviewModel = (await import('../DB/models/review.model.js')).default;
    
    // Check all requests for this user
    const allRequests = await specialRequestModel.find({ user: userId });
    console.log('\n=== ALL REQUESTS ===');
    console.log('Total requests found:', allRequests.length);
    
    allRequests.forEach((req, i) => {
      console.log(`\nRequest ${i + 1}:`);
      console.log(`  ID: ${req._id}`);
      console.log(`  Status: ${req.status}`);
      console.log(`  RequestType: ${req.requestType}`);
      console.log(`  Budget: ${req.budget}`);
      console.log(`  FinalPrice: ${req.finalPrice}`);
      console.log(`  CreatedAt: ${req.createdAt}`);
    });
    
    // Test the exact aggregation from controller
    console.log('\n=== TESTING CONTROLLER AGGREGATION ===');
    
    const totalOrders = await specialRequestModel.countDocuments({ user: userId });
    console.log('Total orders (countDocuments):', totalOrders);
    
    const totalSpentResult = await specialRequestModel.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId), 
          status: { $in: ['completed', 'pending', 'in_progress', 'approved'] }
        } 
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$budget', 0] } } } }
    ]);
    
    console.log('Total spent (aggregation):', totalSpentResult);
    console.log('Total spent value:', totalSpentResult[0]?.total || 0);
    
    // Check if the specific request matches our criteria
    const targetStatusRequests = await specialRequestModel.find({ 
      user: userId, 
      status: { $in: ['completed', 'pending', 'in_progress', 'approved'] }
    });
    
    console.log('\n=== TARGET STATUS REQUESTS ===');
    console.log('Requests with target statuses:', targetStatusRequests.length);
    
    targetStatusRequests.forEach((req, i) => {
      console.log(`\nTarget Request ${i + 1}:`);
      console.log(`  Status: ${req.status}`);
      console.log(`  Budget: ${req.budget}`);
      console.log(`  FinalPrice: ${req.finalPrice}`);
      console.log(`  Calculated amount: ${req.finalPrice || req.budget || 0}`);
    });
    
    // Check reviews
    const reviews = await reviewModel.find({ user: userId });
    console.log('\n=== REVIEWS ===');
    console.log('Total reviews:', reviews.length);
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      console.log('Average rating:', avgRating);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugSpecificUser(); 