import fs from 'fs';
import path from 'path';

const swaggerPath = path.join(process.cwd(), 'src/swagger/arthub-swagger.json');

async function updateSwaggerAdmin() {
  try {
    console.log('🔄 Updating Swagger documentation for admin endpoints...');
    
    // Read the current swagger file
    const swaggerContent = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    
    // Find the admin/admins POST endpoint
    const adminAdminsPath = swaggerContent.paths['/api/admin/admins'];
    
    if (adminAdminsPath && adminAdminsPath.post) {
      // Update the POST endpoint
      adminAdminsPath.post.description = 'إنشاء مستخدم أدمن جديد مع رفع صورة اختيارية (السوبر أدمن فقط)';
      
      // Update request body to multipart/form-data
      adminAdminsPath.post.requestBody.content = {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'البريد الإلكتروني',
                example: 'newadmin@example.com'
              },
              password: {
                type: 'string',
                format: 'password',
                minLength: 8,
                description: 'كلمة المرور',
                example: 'Password123!'
              },
              displayName: {
                type: 'string',
                description: 'اسم العرض',
                example: 'أحمد محمد'
              },
              role: {
                type: 'string',
                enum: ['admin', 'superadmin'],
                default: 'admin',
                description: 'نوع الأدمن'
              },
              profileImage: {
                type: 'string',
                format: 'binary',
                description: 'صورة الملف الشخصي (JPEG, PNG) - اختياري'
              }
            }
          }
        }
      };
      
      // Update response to include profileImage
      const response201 = adminAdminsPath.post.responses['201'];
      if (response201 && response201.content && response201.content['application/json']) {
        const dataSchema = response201.content['application/json'].schema.properties.data;
        if (dataSchema && dataSchema.properties) {
          dataSchema.properties.profileImage = {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                example: 'https://res.cloudinary.com/example/image/upload/v1234567890/admin-profile.jpg'
              },
              id: {
                type: 'string',
                example: 'arthub/admin-profiles/admin_1234567890_abc123'
              }
            }
          };
          
          // Update existing properties with examples
          dataSchema.properties._id.example = '507f1f77bcf86cd799439011';
          dataSchema.properties.email.example = 'newadmin@example.com';
          dataSchema.properties.displayName.example = 'أحمد محمد';
          dataSchema.properties.role.example = 'admin';
          dataSchema.properties.createdAt.example = '2025-01-18T10:30:00.000Z';
          
          // Remove isActive if it exists
          if (dataSchema.properties.isActive) {
            delete dataSchema.properties.isActive;
          }
        }
      }
      
      // Update 400 error message
      const response400 = adminAdminsPath.post.responses['400'];
      if (response400) {
        response400.description = 'بيانات غير صحيحة أو فشل في رفع الصورة';
        if (response400.content && response400.content['application/json']) {
          const messageProperty = response400.content['application/json'].schema.properties.message;
          if (messageProperty) {
            messageProperty.example = 'البريد الإلكتروني مستخدم بالفعل أو فشل في رفع الصورة';
          }
        }
      }
      
      // Write the updated swagger file
      fs.writeFileSync(swaggerPath, JSON.stringify(swaggerContent, null, 2));
      
      console.log('✅ Swagger documentation updated successfully!');
      console.log('📝 Changes made:');
      console.log('   - Updated description to include image upload');
      console.log('   - Changed content-type to multipart/form-data');
      console.log('   - Added profileImage field');
      console.log('   - Updated response to include profileImage data');
      console.log('   - Updated error messages');
      
    } else {
      console.error('❌ Could not find /api/admin/admins POST endpoint in Swagger file');
    }
    
  } catch (error) {
    console.error('❌ Error updating Swagger:', error.message);
  }
}

// Run the update
updateSwaggerAdmin().catch(console.error); 