import axios from 'axios';

const BASE_URL = 'https://arthub-backend.up.railway.app';

async function quickTest() {
  try {
    console.log('🧪 Quick test of categories endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/categories`);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Message:', response.data.message);
    console.log('✅ Categories count:', response.data.data?.categories?.length || 0);
    
    if (response.data.data?.categories?.length > 0) {
      console.log('✅ First category:', response.data.data.categories[0].name);
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
  }
}

quickTest(); 