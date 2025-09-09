import jwt from 'jsonwebtoken';

// Test token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODcyYzZmYjUwMWVlODZjYzNjNWI3ODEiLCJlbWFpbCI6ImVuZ3NhbGVocG1AZ21haWwuY29tIiwicm9sZSI6ImFydGlzdCIsImlhdCI6MTczNjQ0NDQ0NCwiZXhwIjoxNzM2NTMwODQ0fQ.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q';

try {
  console.log('🔍 Decoding token...');
  const decoded = jwt.decode(token);
  console.log('📋 Decoded token:', JSON.stringify(decoded, null, 2));
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    console.log('❌ Token is expired!');
    console.log('⏰ Expires at:', new Date(decoded.exp * 1000));
    console.log('⏰ Current time:', new Date(now * 1000));
  } else {
    console.log('✅ Token is valid');
    console.log('⏰ Expires at:', new Date(decoded.exp * 1000));
  }
} catch (error) {
  console.error('❌ Error decoding token:', error.message);
}
