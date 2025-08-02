import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard Overview...');
    
    const response = await axios.get(`${BASE_URL}/api/dashboard/overview`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('📊 Data:', response.data.data.statistics);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboard(); 