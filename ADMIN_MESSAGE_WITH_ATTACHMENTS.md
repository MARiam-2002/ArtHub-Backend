# Admin Message with Attachments - API Update

## 🎯 **الهدف:**
تحديث API إرسال الرسائل من الأدمن ليدعم:
1. **subject** (موضوع الرسالة) - مطلوب
2. **message** (نص الرسالة) - مطلوب  
3. **رفع ملفات متعددة** (صور، فيديوهات، PDF، إلخ) - اختياري

## ✅ **التحديثات المطبقة:**

### 1️⃣ **Controller Updates:**
```javascript
// إضافة معالجة الملفات المرفقة
let attachments = [];
if (req.files && req.files.length > 0) {
  // رفع الملفات إلى Cloudinary
  const uploadPromises = req.files.map(async (file, index) => {
    const { secure_url, public_id, format, bytes } = await cloudinary.v2.uploader.upload(
      file.path,
      {
        folder: `arthub/admin-messages/${user._id}/${Date.now()}`,
        resource_type: 'auto', // يدعم جميع أنواع الملفات
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi', 'mp3', 'wav']
      }
    );
    
    return {
      originalName: file.originalname,
      url: secure_url,
      id: public_id,
      format: format,
      size: bytes,
      type: file.mimetype
    };
  });
  
  attachments = await Promise.all(uploadPromises);
}

// إضافة المرفقات للـ notification
const notification = await notificationModel.create({
  // ... البيانات الأساسية
  data: {
    // ... البيانات الأخرى
    attachments: attachments, // إضافة المرفقات
    sentAt: new Date()
  }
});
```

### 2️⃣ **Validation Updates:**
```javascript
// تحديث validation schema
export const sendMessageSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  }),
  body: joi.object({
    subject: joi.string().min(1).max(200).required().messages({
      'string.min': 'موضوع الرسالة يجب أن يكون حرف واحد على الأقل',
      'string.max': 'موضوع الرسالة يجب أن يكون أقل من 200 حرف',
      'any.required': 'موضوع الرسالة مطلوب'
    }),
    message: joi.string().min(1).max(2000).required().messages({
      'string.min': 'نص الرسالة مطلوب',
      'string.max': 'نص الرسالة يجب أن يكون أقل من 2000 حرف',
      'any.required': 'نص الرسالة مطلوب'
    })
  })
};
```

### 3️⃣ **Router Updates:**
```javascript
// إضافة middleware لرفع الملفات
router.post('/users/:id/send-message', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  fileUpload([...filterObject.image, ...filterObject.pdf, ...filterObject.video]).array('attachments', 10),
  isValidation(Validators.sendMessageSchema), 
  adminController.sendMessageToUser
);
```

### 4️⃣ **Response Updates:**
```javascript
// تحديث الـ response ليشمل المرفقات
res.json({
  success: true,
  message: 'تم إرسال الرسالة بنجاح',
  data: {
    userId: user._id,
    userName: user.displayName,
    notificationId: notification._id,
    messageType: 'system_notification',
    sentAt: new Date(),
    attachmentsCount: attachments.length,
    attachments: attachments.map(file => ({
      originalName: file.originalName,
      url: file.url,
      format: file.format,
      size: file.size,
      type: file.type
    })),
    notification: {
      // ... بيانات الـ notification
    }
  }
});
```

## 📁 **الملفات المحدثة:**

### ✅ **src/modules/admin/admin.controller.js:**
- إضافة معالجة الملفات المرفقة
- رفع الملفات إلى Cloudinary
- إضافة المرفقات للـ notification
- تحديث الـ response

### ✅ **src/modules/admin/admin.validation.js:**
- تحديث validation schema
- جعل subject مطلوب
- تحديث رسائل الخطأ

### ✅ **src/modules/admin/admin.router.js:**
- إضافة middleware لرفع الملفات
- تحديث Swagger documentation
- دعم multipart/form-data

## 🧪 **اختبار التحديثات:**

```bash
# اختبار API مع المرفقات
npm run test:admin-message-attachments

# اختبار API بدون مرفقات
npm run test:admin-message
```

## 📋 **ملخص التغييرات:**

### ✅ **تم إضافة:**
- دعم رفع ملفات متعددة (صور، فيديوهات، PDF، إلخ)
- معالجة الملفات في Cloudinary
- إضافة المرفقات للـ notification
- تحديث الـ response مع معلومات المرفقات

### ✅ **تم تحديث:**
- جعل subject مطلوب
- تحديث validation rules
- إضافة error handling للملفات
- تحديث Swagger documentation

### ✅ **الأنواع المدعومة:**
- **صور:** jpg, jpeg, png, gif
- **مستندات:** pdf, doc, docx
- **فيديوهات:** mp4, mov, avi
- **صوت:** mp3, wav

## 🎯 **النتيجة:**

الآن API يدعم:
- ✅ **subject** (مطلوب)
- ✅ **message** (مطلوب)
- ✅ **رفع ملفات متعددة** (اختياري)
- ✅ **معالجة جميع أنواع الملفات**
- ✅ **تخزين آمن في Cloudinary**
- ✅ **إرسال المرفقات مع الإشعارات**

**شكراً لك! 🎉** 