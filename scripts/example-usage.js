import { mockData, getMockData, getMockItemById, getPopulatedMockData } from './mock-data.js';

console.log('📚 Example Usage of Mock Data\n');

// Example 1: Get all users
console.log('1. Getting all users:');
const users = getMockData('users');
console.log(`   Found ${users.length} users`);
users.forEach(user => {
  console.log(`   - ${user.displayName} (${user.role})`);
});

// Example 2: Get specific user by ID
console.log('\n2. Getting specific user:');
const ahmedUser = getMockItemById('users', '507f1f77bcf86cd799439011');
if (ahmedUser) {
  console.log(`   Found: ${ahmedUser.displayName}`);
  console.log(`   Email: ${ahmedUser.email}`);
  console.log(`   Role: ${ahmedUser.role}`);
  console.log(`   Bio: ${ahmedUser.bio}`);
}

// Example 3: Get all artworks
console.log('\n3. Getting all artworks:');
const artworks = getMockData('artworks');
console.log(`   Found ${artworks.length} artworks`);
artworks.forEach(artwork => {
  console.log(`   - ${artwork.title} (${artwork.price} SAR)`);
});

// Example 4: Get artworks with populated artist and category
console.log('\n4. Getting artworks with populated data:');
const populatedArtworks = getPopulatedMockData('artworks', {
  artist: 'users',
  category: 'categories'
});

populatedArtworks.forEach(artwork => {
  console.log(`   - ${artwork.title}`);
  console.log(`     Artist: ${artwork.artist?.displayName || 'Unknown'}`);
  console.log(`     Category: ${artwork.category?.name || 'Unknown'}`);
  console.log(`     Price: ${artwork.price} SAR`);
  console.log(`     Status: ${artwork.status}`);
  console.log('');
});

// Example 5: Get categories
console.log('5. Getting categories:');
const categories = getMockData('categories');
console.log(`   Found ${categories.length} categories`);
categories.forEach(category => {
  console.log(`   - ${category.name}: ${category.description}`);
});

// Example 6: Get reviews
console.log('\n6. Getting reviews:');
const reviews = getMockData('reviews');
console.log(`   Found ${reviews.length} reviews`);
reviews.forEach(review => {
  const artwork = getMockItemById('artworks', review.artwork);
  const user = getMockItemById('users', review.user);
  console.log(`   - ${user?.displayName || 'Unknown'} rated "${artwork?.title || 'Unknown'}" ${review.rating}/5`);
});

// Example 7: Get follows
console.log('\n7. Getting follows:');
const follows = getMockData('follows');
console.log(`   Found ${follows.length} follows`);
follows.forEach(follow => {
  const follower = getMockItemById('users', follow.follower);
  const following = getMockItemById('users', follow.following);
  console.log(`   - ${follower?.displayName || 'Unknown'} follows ${following?.displayName || 'Unknown'}`);
});

// Example 8: Get notifications
console.log('\n8. Getting notifications:');
const notifications = getMockData('notifications');
console.log(`   Found ${notifications.length} notifications`);
notifications.forEach(notification => {
  console.log(`   - ${notification.title}: ${notification.message}`);
  console.log(`     Type: ${notification.type}, Read: ${notification.isRead}`);
});

// Example 9: Get special requests
console.log('\n9. Getting special requests:');
const specialRequests = getMockData('specialRequests');
console.log(`   Found ${specialRequests.length} special requests`);
specialRequests.forEach(request => {
  const client = getMockItemById('users', request.client);
  const artist = getMockItemById('users', request.artist);
  console.log(`   - ${client?.displayName || 'Unknown'} requested from ${artist?.displayName || 'Unknown'}`);
  console.log(`     Title: ${request.title}`);
  console.log(`     Budget: ${request.budget} SAR`);
  console.log(`     Status: ${request.status}`);
});

// Example 10: Get transactions
console.log('\n10. Getting transactions:');
const transactions = getMockData('transactions');
console.log(`   Found ${transactions.length} transactions`);
transactions.forEach(transaction => {
  const buyer = getMockItemById('users', transaction.buyer);
  const seller = getMockItemById('users', transaction.seller);
  console.log(`   - ${buyer?.displayName || 'Unknown'} bought from ${seller?.displayName || 'Unknown'}`);
  console.log(`     Amount: ${transaction.amount} SAR`);
  console.log(`     Status: ${transaction.status}`);
});

// Example 11: Filter data
console.log('\n11. Filtering data:');
const artists = users.filter(user => user.role === 'artist');
const regularUsers = users.filter(user => user.role === 'user');
const availableArtworks = artworks.filter(artwork => artwork.status === 'available');

console.log(`   Artists: ${artists.length}`);
console.log(`   Regular users: ${regularUsers.length}`);
console.log(`   Available artworks: ${availableArtworks.length}`);

// Example 12: Calculate statistics
console.log('\n12. Calculating statistics:');
const totalArtworkValue = artworks.reduce((sum, artwork) => sum + artwork.price, 0);
const avgArtworkPrice = totalArtworkValue / artworks.length;
const totalReviews = reviews.length;
const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

console.log(`   Total artwork value: ${totalArtworkValue} SAR`);
console.log(`   Average artwork price: ${avgArtworkPrice.toFixed(2)} SAR`);
console.log(`   Total reviews: ${totalReviews}`);
console.log(`   Average rating: ${avgRating.toFixed(1)}/5`);

// Example 13: Search functionality
console.log('\n13. Search functionality:');
const searchTerm = 'لوحة';
const searchResults = artworks.filter(artwork => 
  artwork.title.includes(searchTerm) || 
  artwork.description.includes(searchTerm)
);

console.log(`   Search results for "${searchTerm}": ${searchResults.length} artworks`);
searchResults.forEach(artwork => {
  console.log(`   - ${artwork.title}`);
});

// Example 14: Get user's artworks
console.log('\n14. Getting user\'s artworks:');
const ahmedArtworks = artworks.filter(artwork => artwork.artist.toString() === '507f1f77bcf86cd799439011');
console.log(`   Ahmed's artworks: ${ahmedArtworks.length}`);
ahmedArtworks.forEach(artwork => {
  console.log(`   - ${artwork.title} (${artwork.price} SAR)`);
});

// Example 15: Get category's artworks
console.log('\n15. Getting category\'s artworks:');
const drawingArtworks = artworks.filter(artwork => artwork.category.toString() === '60d0fe4f5311236168a109ce');
console.log(`   Drawing category artworks: ${drawingArtworks.length}`);
drawingArtworks.forEach(artwork => {
  console.log(`   - ${artwork.title} (${artwork.price} SAR)`);
});

console.log('\n🎉 Example usage completed!');
console.log('\n💡 You can use these patterns in your development:');
console.log('   - getMockData(collectionName) - Get all items from a collection');
console.log('   - getMockItemById(collectionName, id) - Get specific item by ID');
console.log('   - getPopulatedMockData(collectionName, populateFields) - Get items with populated references');
console.log('   - mockData[collectionName] - Direct access to raw data'); 