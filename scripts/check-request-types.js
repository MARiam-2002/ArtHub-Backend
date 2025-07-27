import mongoose from 'mongoose';
import dotenv from 'dotenv';
import specialRequestModel from '../DB/models/specialRequest.model.js';

dotenv.config();

async function checkRequestTypes() {
  try {
    console.log('🔍 فحص أنواع الطلبات...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const artistId = '6872b83044e2488629f74e8a';
    const artistObjectId = new mongoose.Types.ObjectId(artistId);
    
    console.log('🆔 Artist ID:', artistId);
    
    // فحص جميع الطلبات للفنان
    const allRequests = await specialRequestModel.find({ 
      artist: artistObjectId 
    }).lean();
    
    console.log('\n📊 إحصائيات الطلبات:');
    console.log('- إجمالي الطلبات:', allRequests.length);
    
    // تجميع الطلبات حسب النوع
    const requestsByType = {};
    const requestsByStatus = {};
    
    allRequests.forEach(request => {
      // حسب النوع
      const type = request.requestType || 'unknown';
      if (!requestsByType[type]) {
        requestsByType[type] = [];
      }
      requestsByType[type].push(request);
      
      // حسب الحالة
      const status = request.status || 'unknown';
      if (!requestsByStatus[status]) {
        requestsByStatus[status] = [];
      }
      requestsByStatus[status].push(request);
    });
    
    console.log('\n📋 الطلبات حسب النوع:');
    Object.keys(requestsByType).forEach(type => {
      const requests = requestsByType[type];
      const completed = requests.filter(r => r.status === 'completed').length;
      const totalValue = requests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.finalPrice || r.budget || 0), 0);
      
      console.log(`- ${type}: ${requests.length} طلب (${completed} مكتمل، ${totalValue} ريال)`);
    });
    
    console.log('\n📋 الطلبات حسب الحالة:');
    Object.keys(requestsByStatus).forEach(status => {
      const requests = requestsByStatus[status];
      console.log(`- ${status}: ${requests.length} طلب`);
    });
    
    // تفاصيل كل طلب
    console.log('\n📝 تفاصيل الطلبات:');
    allRequests.forEach((request, index) => {
      console.log(`${index + 1}. ${request.requestType || 'غير محدد'}`);
      console.log(`   العنوان: ${request.title || 'غير محدد'}`);
      console.log(`   الميزانية: ${request.budget} ${request.currency}`);
      console.log(`   السعر النهائي: ${request.finalPrice || 'غير محدد'} ${request.currency}`);
      console.log(`   الحالة: ${request.status}`);
      console.log(`   الأولوية: ${request.priority}`);
      console.log(`   تاريخ الإنشاء: ${request.createdAt}`);
      console.log('   ---');
    });
    
    // حساب الإحصائيات الصحيحة
    const completedRequests = allRequests.filter(r => r.status === 'completed');
    const totalSales = completedRequests.reduce((sum, r) => sum + (r.finalPrice || r.budget || 0), 0);
    
    console.log('\n💰 الإحصائيات الصحيحة:');
    console.log('- إجمالي الطلبات:', allRequests.length);
    console.log('- الطلبات المكتملة:', completedRequests.length);
    console.log('- إجمالي المبيعات:', totalSales, 'ريال');
    
    // فحص جميع أنواع الطلبات في النظام
    console.log('\n🔍 جميع أنواع الطلبات في النظام:');
    const allRequestTypes = await specialRequestModel.distinct('requestType');
    console.log('أنواع الطلبات المتاحة:', allRequestTypes);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkRequestTypes(); 