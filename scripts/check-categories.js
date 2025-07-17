import mongoose from 'mongoose';
import categoryModel from '../DB/models/category.model.js';

const connectDB = async () => {
  try {
    const connectionUrl = 'mongodb://localhost:27017/arthub';
    console.log('🔄 Connecting to MongoDB at:', connectionUrl);
    await mongoose.connect(connectionUrl);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('💡 Make sure MongoDB is running locally on port 27017');
    process.exit(1);
  }
};

async function checkCategories() {
  try {
    await connectDB();

    const categories = await categoryModel.find({});
    
    console.log('\n📂 Categories in database:');
    if (categories.length === 0) {
      console.log('❌ No categories found. Creating default categories...');
      
      // إنشاء تصنيفات افتراضية
      const defaultCategories = [
        {
          name: 'لوحات زيتية',
          description: 'لوحات مرسومة بالألوان الزيتية',
          image: {
            url: 'https://example.com/oil-paintings.jpg',
            id: 'oil_paintings'
          }
        },
        {
          name: 'رسوم رقمية',
          description: 'أعمال فنية رقمية',
          image: {
            url: 'https://example.com/digital-art.jpg',
            id: 'digital_art'
          }
        },
        {
          name: 'خط عربي',
          description: 'فن الخط العربي',
          image: {
            url: 'https://example.com/arabic-calligraphy.jpg',
            id: 'arabic_calligraphy'
          }
        }
      ];

      const savedCategories = await categoryModel.insertMany(defaultCategories);
      console.log(`✅ Created ${savedCategories.length} default categories`);
      
      savedCategories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat._id})`);
      });
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkCategories(); 