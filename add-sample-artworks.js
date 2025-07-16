import mongoose from 'mongoose';
import artworkModel from './DB/models/artwork.model.js';
import userModel from './DB/models/user.model.js';
import categoryModel from './DB/models/category.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/arthub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function addSampleArtworks() {
  try {
    await connectDB();
    
    // Get existing categories and artists
    const categories = await categoryModel.find({}).limit(3);
    const artists = await userModel.find({ role: 'artist' }).limit(3);
    
    if (categories.length === 0 || artists.length === 0) {
      console.log('❌ No categories or artists found. Please seed the database first.');
      return;
    }
    
    const sampleArtworks = [
      {
        title: 'لوحة المناظر الطبيعية',
        description: 'لوحة زيتية جميلة تصور المناظر الطبيعية الخلابة',
        images: [
          {
            url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341482/image_13_mhcq4w.png',
            publicId: 'image_13_mhcq4w'
          }
        ],
        price: 2500,
        currency: 'SAR',
        status: 'available',
        category: categories[0]._id,
        artist: artists[0]._id,
        tags: ['طبيعة', 'رسم زيتي'],
        isFramed: true,
        dimensions: { width: 80, height: 60, depth: 2 },
        materials: ['زيت على قماش'],
        viewCount: 156,
        likeCount: 23,
        averageRating: 4.5,
        reviewsCount: 8,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'منحوتة المرأة العارية',
        description: 'منحوتة رخامية كلاسيكية تصور جمال المرأة',
        images: [
          {
            url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341485/image_11_unagay.png',
            publicId: 'image_11_unagay'
          }
        ],
        price: 8500,
        currency: 'SAR',
        status: 'available',
        category: categories[1]?._id || categories[0]._id,
        artist: artists[1]?._id || artists[0]._id,
        tags: ['نحت', 'رخام', 'كلاسيكي'],
        isFramed: false,
        dimensions: { width: 40, height: 120, depth: 30 },
        materials: ['رخام أبيض'],
        viewCount: 89,
        likeCount: 15,
        averageRating: 4.8,
        reviewsCount: 5,
        isAvailable: true,
        isFeatured: true
      },
      {
        title: 'صورة غروب الشمس',
        description: 'صورة فوتوغرافية مذهلة لغروب الشمس على البحر',
        images: [
          {
            url: 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341487/image_10_ov2cpb.png',
            publicId: 'image_10_ov2cpb'
          }
        ],
        price: 1200,
        currency: 'SAR',
        status: 'available',
        category: categories[2]?._id || categories[0]._id,
        artist: artists[2]?._id || artists[0]._id,
        tags: ['تصوير', 'غروب الشمس', 'طبيعة'],
        isFramed: true,
        dimensions: { width: 60, height: 40, depth: 1 },
        materials: ['طباعة فوتوغرافية'],
        viewCount: 234,
        likeCount: 45,
        averageRating: 4.7,
        reviewsCount: 12,
        isAvailable: true,
        isFeatured: true
      }
    ];
    
    // Add artworks
    const addedArtworks = await artworkModel.insertMany(sampleArtworks);
    console.log(`✅ Added ${addedArtworks.length} sample artworks`);
    
    // Show the added artworks
    console.log('\n📋 Added artworks:');
    addedArtworks.forEach(artwork => {
      console.log(`- ${artwork.title}: rating=${artwork.averageRating}, reviews=${artwork.reviewsCount}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

addSampleArtworks(); 