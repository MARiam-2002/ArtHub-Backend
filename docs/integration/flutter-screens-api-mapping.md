# خريطة الشاشات و APIs - ArtHub Flutter App

## 📱 دليل الشاشات والـ APIs المطلوبة

### 🔐 مجموعة شاشات المصادقة

#### 1. شاشة Splash Screen
- **APIs المطلوبة:** لا توجد
- **الوظيفة:** فحص حالة تسجيل الدخول من التخزين المحلي

#### 2. شاشة تسجيل الدخول
```
APIs المطلوبة:
• POST /api/auth/login (تسجيل دخول عادي)
• POST /api/auth/google (تسجيل دخول Google)
• POST /api/auth/facebook (تسجيل دخول Facebook)
• POST /api/auth/firebase (تسجيل دخول Firebase)
```

#### 3. شاشة إنشاء حساب
```
APIs المطلوبة:
• POST /api/auth/register (إنشاء حساب جديد)
• POST /api/auth/verify-email (التحقق من الإيميل)
```

#### 4. شاشة نسيت كلمة المرور
```
APIs المطلوبة:
• POST /api/auth/forgot-password (إرسال رمز التحقق)
• POST /api/auth/verify-reset-code (التحقق من الرمز)
• POST /api/auth/reset-password (تغيير كلمة المرور)
```

---

### 🏠 مجموعة الشاشات الرئيسية

#### 1. الشاشة الرئيسية (Home)
```
APIs المطلوبة:
• GET /api/home (بيانات الصفحة الرئيسية)
• GET /api/categories (الفئات)
• GET /api/home/trending (الأعمال الشائعة)
• GET /api/notifications (عدد الإشعارات غير المقروءة)
```

#### 2. شاشة البحث
```
APIs المطلوبة:
• GET /api/home/search?q=keyword (البحث العام)
• GET /api/categories (فلترة حسب الفئة)
• GET /api/artworks (فلترة متقدمة)
```

#### 3. شاشة الفئات
```
APIs المطلوبة:
• GET /api/categories (جميع الفئات)
• GET /api/artworks?category=categoryId (أعمال الفئة)
```

---

### 🎨 مجموعة شاشات الأعمال الفنية

#### 1. شاشة قائمة الأعمال الفنية
```
APIs المطلوبة:
• GET /api/artworks?page=1&limit=20 (قائمة الأعمال)
• GET /api/categories (فلترة حسب الفئة)
• POST /api/user/wishlist (إضافة/إزالة من المفضلة)
```

#### 2. شاشة تفاصيل العمل الفني
```
APIs المطلوبة:
• GET /api/artworks/:artworkId (تفاصيل العمل)
• GET /api/reviews/artwork/:artworkId (تقييمات العمل)
• POST /api/user/wishlist (إضافة/إزالة من المفضلة)
• POST /api/reviews/artwork (إضافة تقييم)
• POST /api/reports (إبلاغ عن العمل)
• POST /api/transactions (شراء العمل)
```

#### 3. شاشة إضافة عمل فني (للفنانين)
```
APIs المطلوبة:
• POST /api/image/upload (رفع الصور)
• GET /api/categories (اختيار الفئة)
• POST /api/artworks (إضافة العمل)
```

#### 4. شاشة تعديل العمل الفني
```
APIs المطلوبة:
• GET /api/artworks/:artworkId (بيانات العمل الحالية)
• POST /api/image/upload (رفع صور جديدة)
• PUT /api/artworks/:artworkId (تحديث العمل)
• DELETE /api/artworks/:artworkId (حذف العمل)
```

---

### 👤 مجموعة شاشات الملف الشخصي

#### 1. شاشة الملف الشخصي
```
APIs المطلوبة:
• GET /api/user/profile (بيانات المستخدم)
• GET /api/artworks?artist=userId (أعمال المستخدم)
• GET /api/follow/followers (المتابعون)
• GET /api/follow/following (المتابعون)
• GET /api/reviews/artist/:artistId (تقييمات الفنان)
```

#### 2. شاشة تعديل الملف الشخصي
```
APIs المطلوبة:
• GET /api/user/profile (البيانات الحالية)
• POST /api/image/upload (رفع صورة الملف الشخصي)
• PUT /api/user/profile (تحديث البيانات)
```

#### 3. شاشة المفضلة
```
APIs المطلوبة:
• GET /api/user/wishlist (قائمة المفضلة)
• POST /api/user/wishlist (إزالة من المفضلة)
```

#### 4. شاشة الإعدادات
```
APIs المطلوبة:
• GET /api/user/profile (الإعدادات الحالية)
• PUT /api/user/change-password (تغيير كلمة المرور)
• PUT /api/user/notification-settings (إعدادات الإشعارات)
• DELETE /api/user/account (حذف الحساب)
```

---

### 💬 مجموعة شاشات المحادثة

#### 1. شاشة قائمة المحادثات
```
APIs المطلوبة:
• GET /api/chat (قائمة المحادثات)
• WebSocket: استقبال الرسائل الجديدة
```

#### 2. شاشة المحادثة
```
APIs المطلوبة:
• GET /api/chat/:chatId/messages (رسائل المحادثة)
• POST /api/chat/:chatId/send (إرسال رسالة)
• PATCH /api/chat/:chatId/read (تعليم كمقروء)
• POST /api/image/upload (إرسال صور)
• WebSocket: الرسائل المباشرة
```

#### 3. شاشة إنشاء محادثة جديدة
```
APIs المطلوبة:
• POST /api/chat/create (إنشاء محادثة)
• GET /api/user/search (البحث عن المستخدمين)
```

---

### 🔔 شاشة الإشعارات

```
APIs المطلوبة:
• GET /api/notifications (قائمة الإشعارات)
• PATCH /api/notifications/:id/read (تعليم كمقروء)
• DELETE /api/notifications/:id (حذف إشعار)
• DELETE /api/notifications (حذف جميع الإشعارات)
```

---

### 👥 مجموعة شاشات المتابعة

#### 1. شاشة المتابعين
```
APIs المطلوبة:
• GET /api/follow/followers (قائمة المتابعين)
• POST /api/follow/toggle (متابعة/إلغاء متابعة)
```

#### 2. شاشة المتابعون
```
APIs المطلوبة:
• GET /api/follow/following (قائمة المتابعين)
• POST /api/follow/toggle (إلغاء المتابعة)
```

#### 3. شاشة اكتشاف الفنانين
```
APIs المطلوبة:
• GET /api/user/top-artists (أفضل الفنانين)
• GET /api/follow/status/:artistId (حالة المتابعة)
• POST /api/follow/toggle (متابعة الفنان)
```

---

### 🛒 مجموعة شاشات المعاملات

#### 1. شاشة قائمة المعاملات
```
APIs المطلوبة:
• GET /api/transactions (قائمة المعاملات)
• GET /api/transactions?status=pending (فلترة حسب الحالة)
```

#### 2. شاشة تفاصيل المعاملة
```
APIs المطلوبة:
• GET /api/transactions/:id (تفاصيل المعاملة)
• PATCH /api/transactions/:id/status (تحديث الحالة)
• POST /api/transactions/:id/tracking (تحديث معلومات الشحن)
```

#### 3. شاشة إنشاء طلب شراء
```
APIs المطلوبة:
• GET /api/artworks/:id (تفاصيل العمل)
• POST /api/transactions (إنشاء المعاملة)
```

---

### 🎯 مجموعة شاشات الطلبات المخصصة

#### 1. شاشة قائمة الطلبات المخصصة
```
APIs المطلوبة:
• GET /api/special-requests (قائمة الطلبات)
• GET /api/special-requests?status=open (فلترة حسب الحالة)
```

#### 2. شاشة تفاصيل الطلب المخصص
```
APIs المطلوبة:
• GET /api/special-requests/:id (تفاصيل الطلب)
• GET /api/special-requests/:id/proposals (العروض المقدمة)
• POST /api/special-requests/:id/proposals (تقديم عرض)
```

#### 3. شاشة إنشاء طلب مخصص
```
APIs المطلوبة:
• POST /api/image/upload (رفع صور مرجعية)
• GET /api/categories (اختيار الفئة)
• POST /api/special-requests (إنشاء الطلب)
```

---

### ⭐ مجموعة شاشات التقييمات

#### 1. شاشة تقييمات العمل الفني
```
APIs المطلوبة:
• GET /api/reviews/artwork/:id (تقييمات العمل)
• POST /api/reviews/artwork (إضافة تقييم)
```

#### 2. شاشة تقييمات الفنان
```
APIs المطلوبة:
• GET /api/reviews/artist/:id (تقييمات الفنان)
• POST /api/reviews/artist (إضافة تقييم)
```

---

### 📊 شاشات التقارير والإبلاغ

#### 1. شاشة إبلاغ عن محتوى
```
APIs المطلوبة:
• POST /api/reports (إرسال الإبلاغ)
```

---

## 🔧 APIs مشتركة في جميع الشاشات

### APIs أساسية مطلوبة في معظم الشاشات:
```
• GET /api/health (فحص حالة الخادم)
• POST /api/auth/refresh (تجديد التوكن)
• GET /api/user/profile (بيانات المستخدم الحالي)
• GET /api/notifications (عدد الإشعارات غير المقروءة)
```

---

## 📱 تدفق التطبيق (App Flow)

### 1. بداية التطبيق
```
Splash Screen → فحص التوكن → 
إذا موجود: الصفحة الرئيسية
إذا غير موجود: شاشة تسجيل الدخول
```

### 2. تسجيل الدخول
```
شاشة تسجيل الدخول → API تسجيل الدخول → 
حفظ التوكن → الصفحة الرئيسية
```

### 3. تصفح الأعمال الفنية
```
الصفحة الرئيسية → قائمة الأعمال → 
تفاصيل العمل → شراء/إضافة للمفضلة
```

### 4. المحادثة
```
قائمة المحادثات → اختيار محادثة → 
شاشة المحادثة (مع WebSocket)
```

---

## 🚀 نصائح للتطوير

### 1. إدارة الحالة (State Management)
- استخدم Provider أو Riverpod لإدارة حالة التطبيق
- احفظ التوكن في Secure Storage
- استخدم Shared Preferences للإعدادات

### 2. معالجة الأخطاء
- اعرض رسائل خطأ واضحة للمستخدم
- اعمل retry للطلبات الفاشلة
- اعرض loading indicators

### 3. الأداء
- استخدم pagination للقوائم الطويلة
- اعمل caching للصور والبيانات
- استخدم lazy loading للقوائم

### 4. UX/UI
- اعرض placeholder أثناء التحميل
- استخدم pull-to-refresh للتحديث
- اعمل offline mode للبيانات المهمة

---

## 📞 ملاحظات مهمة

1. **التوكن**: تأكد من إرسال JWT Token مع كل طلب محمي
2. **WebSocket**: استخدم Socket.IO للمحادثة والإشعارات المباشرة
3. **الصور**: استخدم multipart/form-data لرفع الصور
4. **الأخطاء**: اعمل معالجة شاملة للأخطاء
5. **الأمان**: لا تحفظ معلومات حساسة في التخزين العادي 