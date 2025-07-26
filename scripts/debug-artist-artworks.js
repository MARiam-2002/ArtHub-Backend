import mongoose from 'mongoose';
import dotenv from 'dotenv';
import artworkModel from '../DB/models/artwork.model.js';
import userModel from '../DB/models/user.model.js';

dotenv.config();

async function debugArtistArtworks() {
  try {
    console.log('🔍 فحص تفصيلي لأعمال الفنان...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const artistId = '6872b83044e2488629f74e8a';
    const artistObjectId = new mongoose.Types.ObjectId(artistId);
    
    console.log('🆔 Artist ID (string):', artistId);
    console.log('🆔 Artist ID (ObjectId):', artistObjectId);
    
    // فحص وجود الفنان
    const artist = await userModel.findById(artistId).lean();
    console.log('👤 بيانات الفنان:', {
      _id: artist?._id,
      displayName: artist?.displayName,
      role: artist?.role,
      isActive: artist?.isActive
    });
    
    // فحص الأعمال الفنية بطرق مختلفة
    console.log('\n🔍 فحص الأعمال الفنية:');
    
    // 1. البحث بالـ string
    const artworksByString = await artworkModel.find({ artist: artistId }).lean();
    console.log('1. البحث بالـ string:', artworksByString.length, 'أعمال');
    
    // 2. البحث بالـ ObjectId
    const artworksByObjectId = await artworkModel.find({ artist: artistObjectId }).lean();
    console.log('2. البحث بالـ ObjectId:', artworksByObjectId.length, 'أعمال');
    
    // 3. البحث بدون فلتر
    const allArtworks = await artworkModel.find({}).lean();
    console.log('3. جميع الأعمال:', allArtworks.length, 'أعمال');
    
    // 4. فحص الأعمال التي تحتوي على artist field
    const artworksWithArtist = allArtworks.filter(artwork => artwork.artist);
    console.log('4. الأعمال التي تحتوي على artist field:', artworksWithArtist.length, 'أعمال');
    
    // 5. فحص نوع البيانات في حقل artist
    if (artworksWithArtist.length > 0) {
      console.log('5. أنواع البيانات في حقل artist:');
      const artistTypes = [...new Set(artworksWithArtist.map(artwork => typeof artwork.artist))];
      console.log('   الأنواع:', artistTypes);
      
      // عرض أول 3 أعمال مع تفاصيل حقل artist
      artworksWithArtist.slice(0, 3).forEach((artwork, index) => {
        console.log(`   العمل ${index + 1}:`, {
          _id: artwork._id,
          title: artwork.title,
          artist: artwork.artist,
          artistType: typeof artwork.artist,
          artistString: artwork.artist?.toString()
        });
      });
    }
    
    // 6. البحث باستخدام regex على string
    const artworksByRegex = await artworkModel.find({ 
      artist: { $regex: artistId, $options: 'i' } 
    }).lean();
    console.log('6. البحث بالـ regex:', artworksByRegex.length, 'أعمال');
    
    // 7. البحث في جميع الحقول
    const artworksInAllFields = await artworkModel.find({
      $or: [
        { artist: artistId },
        { artist: artistObjectId },
        { title: { $regex: artistId, $options: 'i' } },
        { description: { $regex: artistId, $options: 'i' } }
      ]
    }).lean();
    console.log('7. البحث في جميع الحقول:', artworksInAllFields.length, 'أعمال');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

debugArtistArtworks(); 