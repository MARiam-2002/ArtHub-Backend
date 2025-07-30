import mongoose from 'mongoose';
import userModel from '../DB/models/user.model.js';
import specialRequestModel from '../DB/models/specialRequest.model.js';

async function debugUserData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arthub');
    console.log('Connected to database');
    
    const userId = '6872c6eb501ee86cc3c5b77c';
    
    // Check if user exists
    const user = await userModel.findById(userId);
    console.log('User exists:', !!user);
    if (user) {
      console.log('User email:', user.email);
      console.log('User role:', user.role);
    }
    
    // Check special requests for this user
    const requests = await specialRequestModel.find({ user: userId });
    console.log('\nTotal special requests for user:', requests.length);
    
    if (requests.length > 0) {
      console.log('\nRequest details:');
      requests.forEach((req, i) => {
        console.log(`Request ${i + 1}:`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Budget: ${req.budget}`);
        console.log(`  FinalPrice: ${req.finalPrice}`);
        console.log(`  Type: ${req.requestType}`);
      });
    }
    
    // Check all special requests in database
    const allRequests = await specialRequestModel.find().limit(5);
    console.log('\nSample requests in database:', allRequests.length);
    allRequests.forEach((req, i) => {
      console.log(`Sample ${i + 1}: User=${req.user}, Status=${req.status}, Budget=${req.budget}`);
    });
    
    // Test aggregation
    const result = await specialRequestModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: { $ifNull: ['$finalPrice', '$budget', 0] } } } }
    ]);
    
    console.log('\nAggregation result:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugUserData(); 