# 🚀 مرجع سريع - ArtHub APIs

## Base URL
```
https://your-domain.com/api
```

## Headers
```
Content-Type: application/json
Authorization: Bearer JWT_TOKEN  // للطلبات المحمية
```

---

## 🔐 المصادقة (Authentication)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | تسجيل حساب جديد | ❌ |
| POST | `/auth/login` | تسجيل الدخول | ❌ |
| POST | `/auth/firebase` | تسجيل الدخول بـ Firebase | ❌ |
| POST | `/auth/login-with-fingerprint` | تسجيل الدخول بالبصمة | ❌ |
| POST | `/auth/update-fingerprint` | تحديث بصمة الجهاز | ✅ |
| POST | `/auth/forget-password` | نسيان كلمة المرور | ❌ |
| POST | `/auth/verify-forget-code` | التحقق من رمز الاستعادة | ❌ |
| POST | `/auth/reset-password` | إعادة تعيين كلمة المرور | ❌ |
| POST | `/auth/refresh-token` | تجديد التوكن | ❌ |
| POST | `/auth/logout` | تسجيل الخروج | ✅ |
| GET | `/auth/me` | بيانات المستخدم الحالي | ✅ |
| POST | `/auth/fcm-token` | تحديث رمز الإشعارات | ✅ |

---

## 🏠 الصفحة الرئيسية (Home)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/home` | بيانات الصفحة الرئيسية | ❌ |
| GET | `/home/search` | البحث العام | ❌ |
| GET | `/home/trending` | الأعمال الشائعة | ❌ |
| GET | `/home/explore` | استكشاف المحتوى | ❌ |

---

## 🎨 الأعمال الفنية (Artworks)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/artworks` | قائمة الأعمال الفنية | ❌ |
| GET | `/artworks/:id` | تفاصيل العمل الفني | ❌ |
| POST | `/artworks` | إضافة عمل فني جديد | ✅ |
| PUT | `/artworks/:id` | تحديث العمل الفني | ✅ |
| DELETE | `/artworks/:id` | حذف العمل الفني | ✅ |
| GET | `/artworks/search` | البحث في الأعمال | ❌ |
| GET | `/artworks/featured` | الأعمال المميزة | ❌ |

---

## 👤 المستخدمين (Users)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/profile` | الملف الشخصي | ✅ |
| PUT | `/user/profile` | تحديث الملف الشخصي | ✅ |
| GET | `/user/artist/:id` | ملف فنان آخر | ❌ |
| GET | `/user/my-artworks` | أعمالي الفنية | ✅ |
| GET | `/user/wishlist` | قائمة المفضلة | ✅ |
| POST | `/user/wishlist/toggle` | إضافة/إزالة من المفضلة | ✅ |
| GET | `/user/following` | قائمة المتابعين | ✅ |
| PUT | `/user/change-password` | تغيير كلمة المرور | ✅ |
| GET | `/user/notification-settings` | إعدادات الإشعارات | ✅ |
| PUT | `/user/notification-settings` | تحديث إعدادات الإشعارات | ✅ |
| DELETE | `/user/delete-account` | حذف الحساب | ✅ |

---

## 💬 المحادثات (Chat)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat` | قائمة المحادثات | ✅ |
| POST | `/chat/create` | إنشاء محادثة جديدة | ✅ |
| GET | `/chat/:id/messages` | رسائل المحادثة | ✅ |
| POST | `/chat/:id/send` | إرسال رسالة | ✅ |
| PATCH | `/chat/:id/read` | تعليم كمقروء | ✅ |
| DELETE | `/chat/:id` | حذف المحادثة | ✅ |
| GET | `/chat/socket-token` | رمز الاتصال المباشر | ✅ |

---

## 🔔 الإشعارات (Notifications)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | قائمة الإشعارات | ✅ |
| GET | `/notifications/unread-count` | عدد الإشعارات غير المقروءة | ✅ |
| PATCH | `/notifications/:id/read` | تعليم إشعار كمقروء | ✅ |
| PATCH | `/notifications/read-all` | تعليم الكل كمقروء | ✅ |
| DELETE | `/notifications/:id` | حذف إشعار | ✅ |
| DELETE | `/notifications` | حذف جميع الإشعارات | ✅ |
| GET | `/notifications/settings` | إعدادات الإشعارات | ✅ |
| PUT | `/notifications/settings` | تحديث إعدادات الإشعارات | ✅ |

---

## 👥 المتابعة (Follow)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/follow/toggle` | متابعة/إلغاء متابعة | ✅ |
| GET | `/follow/followers/:userId` | قائمة المتابعين | ❌ |
| GET | `/follow/following/:userId` | قائمة المتابعين | ❌ |
| GET | `/follow/status/:userId` | حالة المتابعة | ✅ |

---

## 🛒 المعاملات (Transactions)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/transactions` | إنشاء معاملة جديدة | ✅ |
| GET | `/transactions` | قائمة المعاملات | ✅ |
| GET | `/transactions/:id` | تفاصيل المعاملة | ✅ |
| PATCH | `/transactions/:id/status` | تحديث حالة المعاملة | ✅ |
| GET | `/transactions/buyer` | معاملات المشتري | ✅ |
| GET | `/transactions/seller` | معاملات البائع | ✅ |
| POST | `/transactions/:id/tracking` | تحديث معلومات الشحن | ✅ |

---

## 🎯 الطلبات المخصصة (Special Requests)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/special-requests` | إنشاء طلب مخصص | ✅ |
| GET | `/special-requests/my` | طلباتي | ✅ |
| GET | `/special-requests/artist` | طلبات للفنانين | ✅ |
| GET | `/special-requests/:id` | تفاصيل الطلب | ✅ |
| POST | `/special-requests/:id/response` | تقديم عرض | ✅ |
| PATCH | `/special-requests/:id/accept` | قبول عرض | ✅ |
| PATCH | `/special-requests/:id/status` | تحديث حالة الطلب | ✅ |
| DELETE | `/special-requests/:id` | حذف الطلب | ✅ |

---

## ⭐ التقييمات (Reviews)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reviews/artwork` | تقييم عمل فني | ✅ |
| POST | `/reviews/artist` | تقييم فنان | ✅ |
| GET | `/reviews/artwork/:id` | تقييمات العمل | ❌ |
| GET | `/reviews/artist/:id` | تقييمات الفنان | ❌ |
| GET | `/reviews/my` | تقييماتي | ✅ |
| PUT | `/reviews/:id` | تعديل التقييم | ✅ |
| DELETE | `/reviews/:id` | حذف التقييم | ✅ |
| POST | `/reviews/:id/helpful` | تقييم مفيد | ✅ |

---

## 📊 التقارير (Reports)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reports` | إبلاغ عن محتوى | ✅ |
| GET | `/reports/my` | تقاريري | ✅ |
| GET | `/reports/:id` | تفاصيل التقرير | ✅ |
| DELETE | `/reports/:id` | حذف التقرير | ✅ |

---

## 🖼️ الصور (Images)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/image/upload` | رفع صورة | ✅ |
| GET | `/image/my-images` | صوري | ✅ |
| GET | `/image/:id` | تفاصيل الصورة | ❌ |
| PUT | `/image/:id` | تحديث الصورة | ✅ |
| DELETE | `/image/:id` | حذف الصورة | ✅ |
| GET | `/image/search` | البحث في الصور | ❌ |

---

## 🏷️ الفئات (Categories)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | قائمة الفئات | ❌ |
| GET | `/categories/:id` | تفاصيل الفئة | ❌ |

---

## 📄 الشروط والأحكام (Terms)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/terms` | الشروط والأحكام | ❌ |

---

## 🔧 أمثلة الاستخدام

### تسجيل الدخول
```dart
final response = await ApiService.post('/auth/login', {
  'email': 'user@example.com',
  'password': 'password123'
});
```

### الحصول على الأعمال الفنية
```dart
final response = await ApiService.get('/artworks', 
  queryParameters: {'page': 1, 'limit': 20});
```

### إرسال رسالة
```dart
final response = await ApiService.post('/chat/chatId/send', {
  'message': 'مرحبا',
  'type': 'text'
});
```

### رفع صورة
```dart
final formData = FormData.fromMap({
  'images': [MultipartFile.fromFileSync('path/to/image.jpg')],
  'purpose': 'artwork'
});
final response = await ApiService.post('/image/upload', formData);
```

---

## 📝 ملاحظات مهمة

1. **التوكن**: أرسل JWT Token في Header للطلبات المحمية
2. **Pagination**: معظم القوائم تدعم `page` و `limit`
3. **تنسيق التاريخ**: استخدم ISO 8601 format
4. **الصور**: استخدم `multipart/form-data` لرفع الصور
5. **Socket.IO**: للمحادثات المباشرة والإشعارات
6. **معالجة الأخطاء**: تحقق من `response.success` دائماً

---

## 🚨 أكواد الأخطاء الشائعة

| Code | Description |
|------|-------------|
| 200 | نجح الطلب |
| 201 | تم إنشاء المورد بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح - يجب تسجيل الدخول |
| 403 | ممنوع - ليس لديك صلاحية |
| 404 | المورد غير موجود |
| 409 | تضارب - البيانات موجودة بالفعل |
| 422 | بيانات غير صحيحة |
| 500 | خطأ في الخادم |

هذا المرجع السريع يوفر جميع الـ APIs المطلوبة لتطوير تطبيق ArtHub بـ Flutter بشكل منظم وسهل الوصول. 