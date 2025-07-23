# Profile Image Update - مع Cloudinary

## 🎯 **الميزات الجديدة:**

### ✅ **رفع الصور إلى Cloudinary:**
- رفع الصورة الجديدة إلى Cloudinary
- حذف الصورة القديمة تلقائياً
- حفظ URL و Public ID في قاعدة البيانات

### ✅ **الحقول المدعومة:**
- `displayName` - اسم المستخدم
- `email` - البريد الإلكتروني  
- `profileImage` - صورة البروفايل (file upload)

## 🔧 **كيفية العمل:**

### **1. رفع صورة البروفايل:**
```multipart/form-data
POST /user/profile
Content-Type: multipart/form-data

profileImage: [file]
displayName: "أحمد محمد"
email: "ahmed.mohamed@example.com"
```

### **2. العملية الداخلية:**
1. **حذف الصورة القديمة** من Cloudinary (إذا كانت موجودة)
2. **رفع الصورة الجديدة** إلى Cloudinary في مجلد `arthub/user-profiles/{userId}`
3. **حفظ البيانات** في قاعدة البيانات:
   ```json
   {
     "profileImage": {
       "url": "https://res.cloudinary.com/.../image/upload/...",
       "id": "arthub/user-profiles/507f1f77bcf86cd799439011/image"
     }
   }
   ```

### **3. رسائل Console:**
```
🗑️ Old image deleted successfully
✅ New image uploaded successfully
🔗 URL: https://res.cloudinary.com/...
🆔 Public ID: arthub/user-profiles/507f1f77bcf86cd799439011/image
```

## 📋 **مثال الاستخدام:**

### **تحديث صورة البروفايل مع البيانات:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profileImage=@/path/to/image.jpg" \
  -F "displayName=أحمد محمد" \
  -F "email=ahmed.mohamed@example.com"
```

### **الاستجابة:**
```json
{
  "success": true,
  "message": "تم تحديث الملف الشخصي بنجاح",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "displayName": "أحمد محمد",
    "email": "ahmed.mohamed@example.com",
    "profileImage": {
      "url": "https://res.cloudinary.com/.../image/upload/...",
      "id": "arthub/user-profiles/507f1f77bcf86cd799439011/image"
    }
  }
}
```

## 🚀 **النتيجة:**
✅ **رفع الصور إلى Cloudinary**
✅ **حذف الصور القديمة تلقائياً**
✅ **حفظ URL و ID في قاعدة البيانات**
✅ **نفس طريقة Admin Controller**
✅ **أمان محسن** 