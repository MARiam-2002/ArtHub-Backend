import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkRequestFields() {
  try {
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('Connected to database');
    
    const requestId = '6880080945c3fc04c35b4b1b';
    
    // Import model
    const specialRequestModel = (await import('../DB/models/specialRequest.model.js')).default;
    
    // Check the specific request by ID
    const specificRequest = await specialRequestModel.findById(requestId);
    console.log('\n=== SPECIFIC REQUEST ===');
    console.log('Request found:', !!specificRequest);
    
    if (specificRequest) {
      console.log('All request fields:');
      console.log(JSON.stringify(specificRequest.toObject(), null, 2));
      
      console.log('\nKey fields:');
      console.log(`  _id: ${specificRequest._id}`);
      console.log(`  sender: ${specificRequest.sender}`);
      console.log(`  artist: ${specificRequest.artist}`);
      console.log(`  status: ${specificRequest.status}`);
      console.log(`  budget: ${specificRequest.budget}`);
      console.log(`  finalPrice: ${specificRequest.finalPrice}`);
      console.log(`  requestType: ${specificRequest.requestType}`);
    }
    
    // Check if sender field is used instead of user
    const senderRequests = await specialRequestModel.find({ sender: '6872c6eb501ee86cc3c5b77c' });
    console.log('\n=== SENDER REQUESTS ===');
    console.log('Requests with sender ID:', senderRequests.length);
    
    if (senderRequests.length > 0) {
      senderRequests.forEach((req, i) => {
        console.log(`\nSender Request ${i + 1}:`);
        console.log(`  ID: ${req._id}`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Budget: ${req.budget}`);
        console.log(`  FinalPrice: ${req.finalPrice}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkRequestFields(); 