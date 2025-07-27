import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arthub';

async function checkArtistExists() {
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    const userModel = (await import('../DB/models/user.model.js')).default;
    const artworkModel = (await import('../DB/models/artwork.model.js')).default;

    const artistId = '6872b83044e2488629f74e8a';
    
    console.log('🔍 فحص الفنان:', artistId);
    
    // فحص وجود الفنان
    const artist = await userModel.findById(artistId);
    
    if (!artist) {
      console.log('❌ الفنان غير موجود في قاعدة البيانات');
      return;
    }
    
    console.log('✅ الفنان موجود!');
    console.log('- الاسم:', artist.displayName);
    console.log('- البريد الإلكتروني:', artist.email);
    console.log('- الدور:', artist.role);
    console.log('- الحالة:', artist.isActive ? 'نشط' : 'غير نشط');
    
    if (artist.role !== 'artist') {
      console.log('⚠️ تحذير: الدور ليس "artist"');
      console.log('🔧 تغيير الدور إلى "artist"...');
      
      artist.role = 'artist';
      await artist.save();
      console.log('✅ تم تغيير الدور إلى "artist"');
    }
    
    // فحص الأعمال الفنية
    const artworksCount = await artworkModel.countDocuments({ 
      artist: new mongoose.Types.ObjectId(artistId) 
    });
    
    console.log('🎨 عدد الأعمال الفنية:', artworksCount);
    
    if (artworksCount > 0) {
      const artworks = await artworkModel.find({ 
        artist: new mongoose.Types.ObjectId(artistId) 
      })
        .select('title price isAvailable')
        .limit(5)
        .lean();
      
      console.log('📋 عينة من الأعمال:');
      artworks.forEach((artwork, index) => {
        console.log(`${index + 1}. ${artwork.title} - ${artwork.price} ريال - متاح: ${artwork.isAvailable}`);
      });
    }
    
    // فحص جميع الفنانين
    const allArtists = await userModel.find({ role: 'artist' })
      .select('displayName email role isActive')
      .limit(10)
      .lean();
    
    console.log('\n👥 قائمة الفنانين:');
    allArtists.forEach((artist, index) => {
      console.log(`${index + 1}. ${artist.displayName} (${artist.email}) - ${artist.isActive ? 'نشط' : 'غير نشط'}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkArtistExists(); 