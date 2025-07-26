import mongoose from 'mongoose';
import dotenv from 'dotenv';
import artworkModel from '../DB/models/artwork.model.js';

dotenv.config();

async function checkArtworkFields() {
  try {
    console.log('🔍 فحص الحقول الفعلية للأعمال الفنية...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // جلب أول عمل فني لفحص الحقول
    const artwork = await artworkModel.findOne({}).lean();
    
    if (artwork) {
      console.log('📋 الحقول الموجودة في العمل الفني:');
      console.log(JSON.stringify(artwork, null, 2));
      
      console.log('\n🔍 فحص الحقول المهمة:');
      console.log('- _id:', artwork._id);
      console.log('- title:', artwork.title);
      console.log('- price:', artwork.price);
      console.log('- artist:', artwork.artist);
      console.log('- isAvailable:', artwork.isAvailable);
      console.log('- status:', artwork.status); // فحص إذا كان موجود
      console.log('- isDeleted:', artwork.isDeleted); // فحص إذا كان موجود
      console.log('- createdAt:', artwork.createdAt);
      console.log('- updatedAt:', artwork.updatedAt);
      
      // فحص جميع الحقول
      console.log('\n📊 جميع الحقول:');
      Object.keys(artwork).forEach(key => {
        console.log(`- ${key}: ${typeof artwork[key]} = ${artwork[key]}`);
      });
      
    } else {
      console.log('❌ لا توجد أعمال فنية في قاعدة البيانات');
    }
    
    // فحص عدد الأعمال
    const totalArtworks = await artworkModel.countDocuments({});
    console.log('\n📊 إجمالي الأعمال الفنية:', totalArtworks);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkArtworkFields(); 