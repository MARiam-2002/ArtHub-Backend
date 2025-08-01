// scripts/get-admin-token.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Admin credentials - replace with actual admin credentials
const ADMIN_CREDENTIALS = {
  email: 'superadmin@example.com', // Replace with actual admin email
  password: 'Admin123!' // Replace with actual admin password
};

async function getAdminToken() {
  console.log('🔑 Getting Admin Token for Testing...\n');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });

    if (response.data.success && response.data.data.token) {
      console.log('✅ Admin Token Retrieved Successfully!');
      console.log('\n📋 Token Details:');
      console.log('Token:', response.data.data.token);
      console.log('Role:', response.data.data.user.role);
      console.log('Email:', response.data.data.user.email);
      console.log('Display Name:', response.data.data.user.displayName);
      
      console.log('\n🔧 To use this token in tests:');
      console.log('1. Copy the token above');
      console.log('2. Update the TEST_TOKEN in scripts/test-admin-profile-update.js');
      console.log('3. Or set it as an environment variable: ADMIN_TEST_TOKEN=your_token_here');
      
      return response.data.data.token;
    } else {
      console.log('❌ Failed to get token:', response.data);
    }
  } catch (error) {
    console.error('❌ Error getting admin token:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the admin credentials are correct');
      console.log('2. Make sure the admin account exists in the database');
      console.log('3. Verify the admin role is set correctly');
    }
  }
}

// Also provide a function to test the token
async function testAdminToken(token) {
  console.log('\n🧪 Testing Admin Token...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token is valid!');
    console.log('Admin Profile:', response.data.data);
    return true;
  } catch (error) {
    console.error('❌ Token is invalid:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return false;
  }
}

// Main execution
async function main() {
  const token = await getAdminToken();
  
  if (token) {
    await testAdminToken(token);
  }
}

main().catch(console.error); 