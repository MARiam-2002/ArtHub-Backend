import mongoose from 'mongoose';
import dotenv from 'dotenv';
import specialRequestModel from '../DB/models/specialRequest.model.js';

dotenv.config();

async function checkAllRequestTypes() {
  try {
    console.log('🔍 فحص جميع أنواع الطلبات في النظام...');
    
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.CONNECTION_URL);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // فحص جميع أنواع الطلبات
    const allRequestTypes = await specialRequestModel.distinct('requestType');
    console.log('\n📋 أنواع الطلبات المتاحة:', allRequestTypes);
    
    // فحص الطلبات حسب النوع
    for (const requestType of allRequestTypes) {
      console.log(`\n🔍 فحص طلبات النوع: ${requestType}`);
      
      const requests = await specialRequestModel.find({ requestType }).lean();
      console.log(`- عدد الطلبات: ${requests.length}`);
      
      const completed = requests.filter(r => r.status === 'completed').length;
      const pending = requests.filter(r => r.status === 'pending').length;
      const inProgress = requests.filter(r => r.status === 'in_progress').length;
      
      console.log(`- مكتمل: ${completed}`);
      console.log(`- معلق: ${pending}`);
      console.log(`- قيد التنفيذ: ${inProgress}`);
      
      // حساب إجمالي المبيعات
      const totalSales = requests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.finalPrice || r.budget || 0), 0);
      
      console.log(`- إجمالي المبيعات: ${totalSales} ريال`);
      
      // عرض عينة من الطلبات
      if (requests.length > 0) {
        console.log('- عينة من الطلبات:');
        requests.slice(0, 3).forEach((request, index) => {
          console.log(`  ${index + 1}. ${request.title || 'غير محدد'} - ${request.status} - ${request.budget} ${request.currency}`);
        });
      }
    }
    
    // فحص جميع الطلبات بدون فلتر
    console.log('\n📊 إحصائيات عامة:');
    const allRequests = await specialRequestModel.find({}).lean();
    console.log(`- إجمالي الطلبات: ${allRequests.length}`);
    
    const allCompleted = allRequests.filter(r => r.status === 'completed').length;
    const allPending = allRequests.filter(r => r.status === 'pending').length;
    const allInProgress = allRequests.filter(r => r.status === 'in_progress').length;
    
    console.log(`- مكتمل: ${allCompleted}`);
    console.log(`- معلق: ${allPending}`);
    console.log(`- قيد التنفيذ: ${allInProgress}`);
    
    const totalAllSales = allRequests
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.finalPrice || r.budget || 0), 0);
    
    console.log(`- إجمالي المبيعات: ${totalAllSales} ريال`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

checkAllRequestTypes(); 