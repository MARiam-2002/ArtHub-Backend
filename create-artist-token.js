import jwt from 'jsonwebtoken';

// JWT Secret (using the same as in auth middleware)
const JWT_SECRET = process.env.TOKEN_KEY || 'your-secret-key';

// Create a test token for the artist (6872c6fb501ee86cc3c5b781)
const payload = {
  id: '6872c6fb501ee86cc3c5b781', // Artist ID
  email: 'engsalehpm@gmail.com',
  role: 'artist',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
};

try {
  const token = jwt.sign(payload, JWT_SECRET);
  console.log('🔑 Artist token created:');
  console.log(token);
  console.log('\n📋 Token payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  // Test the token
  console.log('\n🧪 Testing token...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token is valid:', decoded);
  
} catch (error) {
  console.error('❌ Error creating token:', error.message);
}
