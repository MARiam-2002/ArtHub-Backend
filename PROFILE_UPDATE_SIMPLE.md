# Profile Update API - النسخة المبسطة

## 🎯 **المتطلبات:**
بناءً على شاشة Profile، يدعم API تحديث:

1. ✅ **صورة البروفايل** (profileImage)
2. ✅ **اسم المستخدم** (displayName) 
3. ✅ **البريد الإلكتروني** (email)
4. ✅ **كلمة المرور** (password) - منفصل

## 📋 **الحقول المدعومة:**

### **في update profile:**
- `displayName` - اسم المستخدم (2-50 حرف)
- `email` - البريد الإلكتروني (validation)
- `profileImage` - صورة البروفايل (file upload)

### **في change password (منفصل):**
- `currentPassword` - كلمة المرور الحالية
- `newPassword` - كلمة المرور الجديدة
- `confirmPassword` - تأكيد كلمة المرور

## 📝 **أمثلة الاستخدام:**

### **تحديث الملف الشخصي:**
```json
{
  "displayName": "أحمد محمد",
  "email": "ahmed.mohamed@example.com"
}
```

### **تحديث صورة البروفايل:**
```multipart/form-data
profileImage: [file]
displayName: "أحمد محمد"
email: "ahmed.mohamed@example.com"
```

### **تغيير كلمة المرور:**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!",
  "confirmPassword": "newPassword123!"
}
```

## 🚀 **النتيجة:**
✅ **API مبسط وواضح**
✅ **يدعم فقط الحقول المطلوبة**
✅ **سهل الاستخدام**
✅ **يتطابق مع الشاشة** 