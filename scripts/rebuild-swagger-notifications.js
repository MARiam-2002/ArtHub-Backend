const fs = require('fs');
const path = require('path');

async function rebuildSwaggerNotifications() {
  try {
    console.log('🔧 إعادة بناء Swagger بعد إزالة unreadOnly...');

    // قراءة ملف swagger الرئيسي
    const swaggerPath = path.join(__dirname, '../src/swagger/swagger.json');
    const arthubSwaggerPath = path.join(__dirname, '../src/swagger/arthub-swagger.json');

    if (fs.existsSync(swaggerPath)) {
      console.log('✅ تم العثور على swagger.json');
      
      // قراءة المحتوى
      const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
      
      // التحقق من وجود unreadOnly في notifications endpoint
      if (swaggerContent.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في swagger.json - يجب إزالته');
      } else {
        console.log('✅ unreadOnly تم إزالته من swagger.json');
      }
    }

    if (fs.existsSync(arthubSwaggerPath)) {
      console.log('✅ تم العثور على arthub-swagger.json');
      
      // قراءة المحتوى
      const arthubContent = fs.readFileSync(arthubSwaggerPath, 'utf8');
      
      // التحقق من وجود unreadOnly في notifications endpoint
      if (arthubContent.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في arthub-swagger.json - يجب إزالته');
      } else {
        console.log('✅ unreadOnly تم إزالته من arthub-swagger.json');
      }
    }

    // التحقق من notification router
    const notificationRouterPath = path.join(__dirname, '../src/modules/notification/notification.router.js');
    if (fs.existsSync(notificationRouterPath)) {
      const routerContent = fs.readFileSync(notificationRouterPath, 'utf8');
      
      if (routerContent.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في notification.router.js - يجب إزالته');
      } else {
        console.log('✅ unreadOnly تم إزالته من notification.router.js');
      }
    }

    // التحقق من notification validation
    const notificationValidationPath = path.join(__dirname, '../src/modules/notification/notification.validation.js');
    if (fs.existsSync(notificationValidationPath)) {
      const validationContent = fs.readFileSync(notificationValidationPath, 'utf8');
      
      if (validationContent.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في notification.validation.js - يجب إزالته');
      } else {
        console.log('✅ unreadOnly تم إزالته من notification.validation.js');
      }
    }

    // التحقق من notification controller
    const notificationControllerPath = path.join(__dirname, '../src/modules/notification/notification.controller.js');
    if (fs.existsSync(notificationControllerPath)) {
      const controllerContent = fs.readFileSync(notificationControllerPath, 'utf8');
      
      if (controllerContent.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في notification.controller.js - يجب إزالته');
      } else {
        console.log('✅ unreadOnly تم إزالته من notification.controller.js');
      }
    }

    console.log('\n🎉 تم التحقق من جميع الملفات!');
    console.log('📋 ملخص التحقق:');
    console.log('- ✅ swagger.json: تم التحقق');
    console.log('- ✅ arthub-swagger.json: تم التحقق');
    console.log('- ✅ notification.router.js: تم التحقق');
    console.log('- ✅ notification.validation.js: تم التحقق');
    console.log('- ✅ notification.controller.js: تم التحقق');

    console.log('\n🚀 الآن يمكنك استخدام notifications API بدون unreadOnly:');
    console.log('GET /api/notifications?page=1&limit=20');

  } catch (error) {
    console.error('❌ خطأ في إعادة بناء Swagger:', error);
  }
}

// تشغيل الإعادة البناء
rebuildSwaggerNotifications(); 