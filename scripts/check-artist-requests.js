import mongoose from 'mongoose';
import dotenv from 'dotenv';
import specialRequestModel from '../DB/models/specialRequest.model.js';
import userModel from '../DB/models/user.model.js';

dotenv.config();

async function checkArtistRequests() {
  try {
    console.log('🔍 فحص طلبات الفنان...');
    
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
    
    // فحص الطلبات بطرق مختلفة
    console.log('\n🔍 فحص الطلبات:');
    
    // 1. البحث بالـ string
    const requestsByString = await specialRequestModel.find({ artist: artistId }).lean();
    console.log('1. البحث بالـ string:', requestsByString.length, 'طلب');
    
    // 2. البحث بالـ ObjectId
    const requestsByObjectId = await specialRequestModel.find({ artist: artistObjectId }).lean();
    console.log('2. البحث بالـ ObjectId:', requestsByObjectId.length, 'طلب');
    
    // 3. البحث بدون فلتر
    const allRequests = await specialRequestModel.find({}).lean();
    console.log('3. جميع الطلبات:', allRequests.length, 'طلب');
    
    // 4. فحص الطلبات المكتملة
    const completedRequests = await specialRequestModel.find({ 
      artist: artistObjectId,
      status: 'completed'
    }).lean();
    console.log('4. الطلبات المكتملة:', completedRequests.length, 'طلب');
    
    // 5. فحص الطلبات حسب الحالة
    const pendingRequests = await specialRequestModel.find({ 
      artist: artistObjectId,
      status: 'pending'
    }).lean();
    console.log('5. الطلبات المعلقة:', pendingRequests.length, 'طلب');
    
    const inProgressRequests = await specialRequestModel.find({ 
      artist: artistObjectId,
      status: 'in_progress'
    }).lean();
    console.log('6. الطلبات قيد التنفيذ:', inProgressRequests.length, 'طلب');
    
    // 7. عرض تفاصيل الطلبات المكتملة
    if (completedRequests.length > 0) {
      console.log('\n📋 تفاصيل الطلبات المكتملة:');
      completedRequests.forEach((request, index) => {
        console.log(`${index + 1}. طلب ${request.requestType}`);
        console.log(`   العنوان: ${request.title}`);
        console.log(`   الميزانية: ${request.budget} ${request.currency}`);
        console.log(`   السعر النهائي: ${request.finalPrice || 'غير محدد'} ${request.currency}`);
        console.log(`   الحالة: ${request.status}`);
        console.log(`   تاريخ الإنشاء: ${request.createdAt}`);
        console.log(`   الأولوية: ${request.priority}`);
      });
    }
    
    // 8. حساب إجمالي المبيعات
    const totalSales = completedRequests.reduce((total, request) => {
      return total + (request.finalPrice || request.budget || 0);
    }, 0);
    console.log('\n💰 إجمالي المبيعات من الطلبات المكتملة:', totalSales, 'ريال');
    
    // 9. فحص جميع الطلبات للفنان
    if (requestsByObjectId.length > 0) {
      console.log('\n📊 جميع الطلبات للفنان:');
      requestsByObjectId.forEach((request, index) => {
        console.log(`${index + 1}. ${request.title} - ${request.status} - ${request.budget} ${request.currency}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkArtistRequests(); 