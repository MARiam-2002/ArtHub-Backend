import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ARTIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODcyYzZmYjUwMWVlODZjYzNjNWI3ODEiLCJlbWFpbCI6ImVuZ3NhbGVocG1AZ21haWwuY29tIiwicm9sZSI6ImFydGlzdCIsImlhdCI6MTczNjQ0NDQ0NCwiZXhwIjoxNzM2NTMwODQ0fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q';

async function quickTest() {
  console.log('🧪 Quick Artist Test...\n');

  try {
    console.log('📝 Testing GET /special-requests/my...');
    
    const response = await axios.get(`${BASE_URL}/special-requests/my`, {
      headers: {
        'Authorization': `Bearer ${TEST_ARTIST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('🔍 Status:', error.response?.status);
  }
}

quickTest();
