# Profile Update API - مع Password

## 🎯 **المتطلبات المحدثة:**
بناءً على شاشة Profile، يدعم API تحديث:

1. ✅ **صورة البروفايل** (profileImage)
2. ✅ **اسم المستخدم** (displayName) 
3. ✅ **البريد الإلكتروني** (email)
4. ✅ **كلمة المرور** (password) - **جديد في نفس endpoint**

## 📋 **الحقول المدعومة:**

### **في update profile:**
- `displayName` - اسم المستخدم (2-50 حرف)
- `email` - البريد الإلكتروني (validation)
- `password` - كلمة المرور الجديدة (8+ أحرف، حرف + رقم)
- `profileImage` - صورة البروفايل (file upload)

## 📝 **أمثلة الاستخدام:**

### **تحديث الملف الشخصي مع كلمة المرور:**
```json
{
  "displayName": "أحمد محمد",
  "email": "ahmed.mohamed@example.com",
  "password": "newPassword123!"
}
```

### **تحديث صورة البروفايل مع كلمة المرور:**
```multipart/form-data
profileImage: [file]
displayName: "أحمد محمد"
email: "ahmed.mohamed@example.com"
password: "newPassword123!"
```

### **تحديث كلمة المرور فقط:**
```json
{
  "password": "newPassword123!"
}
```

## 🔧 **كيفية العمل:**

### **1. معالجة كلمة المرور:**
- يتم hash كلمة المرور باستخدام bcryptjs
- salt rounds: 12
- يتم حفظ الـ hash في قاعدة البيانات

### **2. العملية الداخلية:**
```javascript
// Handle password update if provided
if (req.body.password) {
  const hashedPassword = await bcryptjs.hash(req.body.password, 12);
  updateData.password = hashedPassword;
}
```

### **3. Validation:**
- كلمة المرور: 8+ أحرف
- يجب أن تحتوي على حرف واحد ورقم واحد على الأقل
- pattern: `^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$`

## 📋 **مثال الطلب الكامل:**

### **تحديث جميع البيانات:**
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profileImage=@/path/to/image.jpg" \
  -F "displayName=أحمد محمد" \
  -F "email=ahmed.mohamed@example.com" \
  -F "password=newPassword123!"
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
✅ **تحديث كلمة المرور في نفس endpoint**
✅ **hash آمن لكلمة المرور**
✅ **validation شامل**
✅ **سهولة الاستخدام**
✅ **يتطابق مع الشاشة** 