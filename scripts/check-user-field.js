import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserField() {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('Connected to database');
    
    const userId = '6872c6eb501ee86cc3c5b77c';
    const requestId = '6880080945c3fc04c35b4b1b';
    
    // Import model
    const specialRequestModel = (await import('../DB/models/specialRequest.model.js')).default;
    
    // Check the specific request by ID
    const specificRequest = await specialRequestModel.findById(requestId);
    console.log('\n=== SPECIFIC REQUEST ===');
    console.log('Request found:', !!specificRequest);
    
    if (specificRequest) {
      console.log('Request details:');
      console.log(`  ID: ${specificRequest._id}`);
      console.log(`  User: ${specificRequest.user}`);
      console.log(`  User type: ${typeof specificRequest.user}`);
      console.log(`  User equals target: ${specificRequest.user.toString() === userId}`);
      console.log(`  Status: ${specificRequest.status}`);
      console.log(`  Budget: ${specificRequest.budget}`);
      console.log(`  FinalPrice: ${specificRequest.finalPrice}`);
    }
    
    // Check all requests with this user ID
    const userRequests = await specialRequestModel.find({ user: userId });
    console.log('\n=== USER REQUESTS ===');
    console.log('Requests with user ID:', userRequests.length);
    
    // Check all requests with this user ID as string
    const userRequestsString = await specialRequestModel.find({ user: userId.toString() });
    console.log('Requests with user ID (string):', userRequestsString.length);
    
    // Check all requests in the collection
    const allRequests = await specialRequestModel.find().limit(5);
    console.log('\n=== SAMPLE REQUESTS ===');
    console.log('Total requests in collection:', await specialRequestModel.countDocuments());
    console.log('Sample requests:');
    
    allRequests.forEach((req, i) => {
      console.log(`\nRequest ${i + 1}:`);
      console.log(`  ID: ${req._id}`);
      console.log(`  User: ${req.user}`);
      console.log(`  User type: ${typeof req.user}`);
      console.log(`  Status: ${req.status}`);
    });
    
    // Check if there are any requests with sender field
    const senderRequests = await specialRequestModel.find({ sender: userId });
    console.log('\n=== SENDER REQUESTS ===');
    console.log('Requests with sender ID:', senderRequests.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserField(); 