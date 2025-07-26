import mongoose from 'mongoose';
import dotenv from 'dotenv';
import artworkModel from '../DB/models/artwork.model.js';
import userModel from '../DB/models/user.model.js';

dotenv.config();

async function checkArtistArtworks() {
  try {
    console.log('🔍 فحص أعمال الفنان...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const artistId = '6872b83044e2488629f74e8a';
    
    // فحص وجود الفنان
    const artist = await userModel.findById(artistId).lean();
    console.log('👤 بيانات الفنان:', {
      _id: artist?._id,
      displayName: artist?.displayName,
      role: artist?.role,
      isActive: artist?.isActive
    });
    
    // فحص الأعمال الفنية
    const artworks = await artworkModel.find({ artist: artistId }).lean();
    console.log('🎨 عدد الأعمال الفنية:', artworks.length);
    
    if (artworks.length > 0) {
      console.log('📋 تفاصيل الأعمال:');
      artworks.forEach((artwork, index) => {
        console.log(`${index + 1}. ${artwork.title} - ${artwork.price} ريال`);
        console.log(`   الحالة: ${artwork.isAvailable ? 'متاح' : 'غير متاح'}`);
        console.log(`   تاريخ الإنشاء: ${artwork.createdAt}`);
      });
    } else {
      console.log('❌ لا توجد أعمال فنية لهذا الفنان');
    }
    
    // فحص الأعمال المحذوفة
    const deletedArtworks = await artworkModel.find({ 
      artist: artistId, 
      isDeleted: true 
    }).lean();
    console.log('🗑️ عدد الأعمال المحذوفة:', deletedArtworks.length);
    
    // فحص جميع الأعمال (بما في ذلك المحذوفة)
    const allArtworks = await artworkModel.find({ artist: artistId }).lean();
    console.log('📊 إجمالي الأعمال (بما في ذلك المحذوفة):', allArtworks.length);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkArtistArtworks(); 