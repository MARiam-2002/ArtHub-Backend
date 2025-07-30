import mongoose from 'mongoose';
import specialRequestModel from '../DB/models/specialRequest.model.js';

async function checkUserRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arthub');
    
    const userId = '6872c6eb501ee86cc3c5b77c';
    
    // Check all requests for this user
    const allRequests = await specialRequestModel.find({ user: userId });
    console.log('Total requests found:', allRequests.length);
    
    if (allRequests.length > 0) {
      console.log('\nRequest details:');
      allRequests.forEach((req, index) => {
        console.log(`Request ${index + 1}:`);
        console.log(`  ID: ${req._id}`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Budget: ${req.budget}`);
        console.log(`  FinalPrice: ${req.finalPrice}`);
        console.log(`  RequestType: ${req.requestType}`);
        console.log(`  CreatedAt: ${req.createdAt}`);
        console.log('---');
      });
    }
    
    // Check specific statuses
    const pendingRequests = await specialRequestModel.find({ 
      user: userId, 
      status: { $in: ['completed', 'pending', 'in_progress', 'approved'] }
    });
    console.log('\nRequests with target statuses:', pendingRequests.length);
    
    // Test the aggregation
    const result = await specialRequestModel.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId), 
          status: { $in: ['completed', 'pending', 'in_progress', 'approved'] }
        } 
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$budget', 0] } } } }
    ]);
    
    console.log('\nAggregation result:', result);
    
    // Check if user exists in specialRequest collection
    const userRequests = await specialRequestModel.find({ user: userId }).limit(1);
    console.log('\nUser exists in specialRequest collection:', userRequests.length > 0);
    
    // Check all users in specialRequest collection
    const allUsers = await specialRequestModel.distinct('user');
    console.log('\nTotal users with requests:', allUsers.length);
    console.log('Sample user IDs:', allUsers.slice(0, 5));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserRequests(); 