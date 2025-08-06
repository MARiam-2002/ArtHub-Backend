import axios from 'axios';

const BASE_URL = 'https://arthub-backend.up.railway.app';

async function finalTest() {
  console.log('🧪 Final test of categories endpoint...');
  
  const tests = [
    {
      name: 'Basic GET /api/categories',
      url: `${BASE_URL}/api/categories`,
      method: 'GET'
    },
    {
      name: 'GET with pagination',
      url: `${BASE_URL}/api/categories?page=1&limit=5`,
      method: 'GET'
    },
    {
      name: 'GET with search',
      url: `${BASE_URL}/api/categories?search=رسم`,
      method: 'GET'
    },
    {
      name: 'GET with stats',
      url: `${BASE_URL}/api/categories?includeStats=true`,
      method: 'GET'
    },
    {
      name: 'GET popular categories',
      url: `${BASE_URL}/api/categories/popular`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 10000
      });
      
      console.log('✅ Status:', response.status);
      console.log('✅ Success:', response.data.success);
      console.log('✅ Message:', response.data.message);
      
      if (response.data.data?.categories) {
        console.log('✅ Categories count:', response.data.data.categories.length);
        if (response.data.data.categories.length > 0) {
          console.log('✅ First category:', response.data.data.categories[0].name);
        }
      }
      
      if (response.data.data?.pagination) {
        console.log('✅ Pagination:', {
          page: response.data.data.pagination.page,
          totalItems: response.data.data.pagination.totalItems,
          totalPages: response.data.data.pagination.totalPages
        });
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${test.name}`);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message);
      console.error('Error:', error.response?.data?.error);
    }
  }
  
  console.log('\n🎉 Final test completed!');
}

finalTest(); 