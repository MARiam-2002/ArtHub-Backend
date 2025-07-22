import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// مسارات الملفات
const swaggerPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger.json');
const backupPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger-backup.json');

async function updateSwaggerAdminMessage() {
  try {
    console.log('🔄 Updating Swagger documentation for admin message with attachments...');
    
    // قراءة ملف Swagger الحالي
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swagger = JSON.parse(swaggerContent);
    
    // البحث عن endpoint إرسال الرسائل
    const sendMessagePath = '/api/admin/users/{id}/send-message';
    
    if (!swagger.paths[sendMessagePath]) {
      console.error('❌ Send message endpoint not found in Swagger');
      return;
    }
    
    console.log('✅ Found send message endpoint');
    
    // تحديث الـ endpoint
    const endpoint = swagger.paths[sendMessagePath].post;
    
    // تحديث العنوان والوصف
    endpoint.summary = 'إرسال رسالة للمستخدم مع المرفقات';
    endpoint.description = 'إرسال رسالة إلى مستخدم محدد مع ملفات مرفقة وإنشاء إشعار نظام';
    
    // تحديث request body
    endpoint.requestBody.content = {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['subject', 'message'],
          properties: {
            subject: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'موضوع الرسالة',
              example: 'رسالة ترحيب من إدارة المنصة'
            },
            message: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              description: 'محتوى الرسالة',
              example: 'مرحباً! نود أن نرحب بك في منصة ArtHub ونشكرك على انضمامك إلينا. نتمنى لك تجربة ممتعة معنا!'
            },
            attachments: {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary'
              },
              description: 'الملفات المرفقة (صور، فيديوهات، مستندات، إلخ)',
              example: ['image1.jpg', 'document.pdf', 'video.mp4']
            }
          }
        }
      }
    };
    
    // تحديث response schema
    const responseSchema = endpoint.responses['200'].content['application/json'].schema;
    const dataProperties = responseSchema.properties.data.properties;
    
    // إضافة attachmentsCount
    dataProperties.attachmentsCount = {
      type: 'number',
      description: 'عدد الملفات المرفقة',
      example: 3
    };
    
    // إضافة attachments array
    dataProperties.attachments = {
      type: 'array',
      description: 'قائمة الملفات المرفقة',
      items: {
        type: 'object',
        properties: {
          originalName: {
            type: 'string',
            description: 'اسم الملف الأصلي',
            example: 'document.pdf'
          },
          url: {
            type: 'string',
            description: 'رابط الملف في Cloudinary',
            example: 'https://res.cloudinary.com/example/document.pdf'
          },
          format: {
            type: 'string',
            description: 'صيغة الملف',
            example: 'pdf'
          },
          size: {
            type: 'number',
            description: 'حجم الملف بالبايت',
            example: 1024000
          },
          type: {
            type: 'string',
            description: 'نوع MIME للملف',
            example: 'application/pdf'
          }
        }
      }
    };
    
    // تحديث notification data ليشمل المرفقات
    const notificationData = dataProperties.notification.properties.data.properties;
    notificationData.attachments = {
      type: 'array',
      description: 'الملفات المرفقة في الإشعار',
      items: {
        type: 'object',
        properties: {
          originalName: {
            type: 'string',
            example: 'document.pdf'
          },
          url: {
            type: 'string',
            example: 'https://res.cloudinary.com/example/document.pdf'
          },
          format: {
            type: 'string',
            example: 'pdf'
          },
          size: {
            type: 'number',
            example: 1024000
          },
          type: {
            type: 'string',
            example: 'application/pdf'
          }
        }
      }
    };
    
    // تحديث رسالة الخطأ
    endpoint.responses['400'].description = 'طلب غير صحيح - بيانات غير صالحة أو فشل في رفع الملفات';
    endpoint.responses['400'].content['application/json'].schema.properties.message.example = 'موضوع الرسالة مطلوب';
    
    // حفظ النسخة الاحتياطية
    fs.writeFileSync(backupPath, swaggerContent);
    console.log('✅ Backup created');
    
    // حفظ التحديثات
    fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
    console.log('✅ Swagger updated successfully');
    
    // طباعة ملخص التحديثات
    console.log('\n📋 Update Summary:');
    console.log('✅ Updated endpoint summary and description');
    console.log('✅ Changed request body to multipart/form-data');
    console.log('✅ Added subject as required field');
    console.log('✅ Added attachments field support');
    console.log('✅ Updated response to include attachmentsCount and attachments');
    console.log('✅ Updated notification data to include attachments');
    console.log('✅ Updated error messages');
    
    console.log('\n🎯 API now supports:');
    console.log('   - Subject (required)');
    console.log('   - Message (required)');
    console.log('   - File attachments (optional)');
    console.log('   - Multiple file types (images, videos, documents)');
    console.log('   - Cloudinary integration');
    console.log('   - Enhanced response with attachment details');
    
  } catch (error) {
    console.error('❌ Error updating Swagger:', error);
  }
}

// تشغيل التحديث
updateSwaggerAdminMessage(); 