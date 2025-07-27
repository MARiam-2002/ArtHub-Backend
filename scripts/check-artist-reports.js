import mongoose from 'mongoose';
import dotenv from 'dotenv';
import reportModel from '../DB/models/report.model.js';
import userModel from '../DB/models/user.model.js';

dotenv.config();

async function checkArtistReports() {
  try {
    console.log('🔍 فحص بلاغات الفنان...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const artistId = '6872b83044e2488629f74e8a';
    const artistObjectId = new mongoose.Types.ObjectId(artistId);
    
    console.log('🆔 Artist ID:', artistId);
    
    // فحص وجود الفنان
    const artist = await userModel.findById(artistId).lean();
    console.log('👤 بيانات الفنان:', {
      _id: artist?._id,
      displayName: artist?.displayName,
      role: artist?.role,
      isActive: artist?.isActive
    });
    
    // فحص البلاغات بطرق مختلفة
    console.log('\n🔍 فحص البلاغات:');
    
    // 1. البحث بالـ string
    const reportsByString = await reportModel.find({ reportedUser: artistId }).lean();
    console.log('1. البحث بالـ string:', reportsByString.length, 'بلاغ');
    
    // 2. البحث بالـ ObjectId
    const reportsByObjectId = await reportModel.find({ reportedUser: artistObjectId }).lean();
    console.log('2. البحث بالـ ObjectId:', reportsByObjectId.length, 'بلاغ');
    
    // 3. البحث بدون فلتر
    const allReports = await reportModel.find({}).lean();
    console.log('3. جميع البلاغات:', allReports.length, 'بلاغ');
    
    // 4. فحص البلاغات التي تحتوي على reportedUser field
    const reportsWithReportedUser = allReports.filter(report => report.reportedUser);
    console.log('4. البلاغات التي تحتوي على reportedUser field:', reportsWithReportedUser.length, 'بلاغ');
    
    // 5. فحص أنواع البيانات في حقل reportedUser
    if (reportsWithReportedUser.length > 0) {
      console.log('5. أنواع البيانات في حقل reportedUser:');
      const reportedUserTypes = [...new Set(reportsWithReportedUser.map(report => typeof report.reportedUser))];
      console.log('   الأنواع:', reportedUserTypes);
      
      // عرض أول 3 بلاغات مع تفاصيل حقل reportedUser
      reportsWithReportedUser.slice(0, 3).forEach((report, index) => {
        console.log(`   البلاغ ${index + 1}:`, {
          _id: report._id,
          type: report.type,
          description: report.description,
          reportedUser: report.reportedUser,
          reportedUserType: typeof report.reportedUser,
          reportedUserString: report.reportedUser?.toString(),
          status: report.status
        });
      });
    }
    
    // 6. البحث في جميع الحقول
    const reportsInAllFields = await reportModel.find({
      $or: [
        { reportedUser: artistId },
        { reportedUser: artistObjectId },
        { description: { $regex: artistId, $options: 'i' } }
      ]
    }).lean();
    console.log('6. البحث في جميع الحقول:', reportsInAllFields.length, 'بلاغ');
    
    // 7. فحص البلاغات حسب الحالة
    const pendingReports = await reportModel.find({ 
      reportedUser: artistObjectId,
      status: 'pending'
    }).lean();
    console.log('7. البلاغات المعلقة:', pendingReports.length, 'بلاغ');
    
    const resolvedReports = await reportModel.find({ 
      reportedUser: artistObjectId,
      status: 'resolved'
    }).lean();
    console.log('8. البلاغات المحلولة:', resolvedReports.length, 'بلاغ');
    
    const activeReports = await reportModel.find({ 
      reportedUser: artistObjectId,
      status: { $ne: 'resolved' }
    }).lean();
    console.log('9. البلاغات النشطة (غير محلولة):', activeReports.length, 'بلاغ');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkArtistReports(); 