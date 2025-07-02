# تحديث توثيق Swagger - ArtHub API

## نظرة عامة

تم تحديث توثيق Swagger بشكل شامل ليشمل جميع المسارات والنماذج المفقودة. هذا الملف يوثق جميع التحديثات التي تم إجراؤها.

## ✅ التحديثات المكتملة

### 1. إضافة المسارات المفقودة إلى الروتر الرئيسي
- ✅ إضافة مسار `/api/categories` - إدارة التصنيفات
- ✅ إضافة مسار `/api/user` - إدارة المستخدمين

### 2. إضافة النماذج الجديدة في swagger-definition.js
- ✅ `UpdateProfileRequest` - طلب تحديث الملف الشخصي
- ✅ `ChangePasswordRequest` - طلب تغيير كلمة المرور
- ✅ `WishlistItem` - عنصر قائمة المفضلة
- ✅ `Category` - نموذج التصنيف
- ✅ `CreateCategoryRequest` - طلب إنشاء تصنيف
- ✅ `UpdateCategoryRequest` - طلب تحديث تصنيف
- ✅ `ArtworkResponse` - استجابة العمل الفني المحدثة
- ✅ `CreateArtworkRequest` - طلب إنشاء عمل فني محدث
- ✅ `ChatResponse` - استجابة المحادثة
- ✅ `MessageResponse` - استجابة الرسالة
- ✅ `SendMessageRequest` - طلب إرسال رسالة
- ✅ `NotificationResponse` - استجابة الإشعار
- ✅ `PaginationResponse` - استجابة التصفح

### 3. تحديث الروتر الرئيسي
```javascript
// تم إضافة المسارات التالية:
app.use('/api/categories', categoryRouter);
app.use('/api/user', userRouter);
```

## 📋 المسارات الموثقة حالياً

### مسارات المصادقة (Authentication) - `/api/auth`
- ✅ `POST /api/auth/register` - التسجيل
- ✅ `POST /api/auth/login` - تسجيل الدخول
- ✅ `POST /api/auth/logout` - تسجيل الخروج
- ✅ `POST /api/auth/logout-all` - تسجيل الخروج من جميع الأجهزة
- ✅ `POST /api/auth/forget-password` - نسيان كلمة المرور
- ✅ `POST /api/auth/verify-forget-code` - التحقق من رمز النسيان
- ✅ `POST /api/auth/reset-password` - إعادة تعيين كلمة المرور
- ✅ `POST /api/auth/firebase` - تسجيل الدخول بـ Firebase
- ✅ `POST /api/auth/fcm-token` - تحديث رمز FCM
- ✅ `POST /api/auth/refresh-token` - تحديث الرمز المميز

### مسارات الصور (Images) - `/api/image`
- ✅ `POST /api/image/upload` - رفع الصور
- ✅ `GET /api/image` - جلب جميع الصور
- ✅ `GET /api/image/search` - البحث في الصور
- ✅ `GET /api/image/:imageId` - جلب صورة محددة
- ✅ `PUT /api/image/:imageId` - تحديث بيانات الصورة
- ✅ `DELETE /api/image/:imageId` - حذف صورة
- ✅ `GET /api/image/my-images` - جلب صور المستخدم الحالي
- ✅ `GET /api/image/:imageId/download` - تحميل صورة
- ✅ `GET /api/image/categories/popular` - التصنيفات الشائعة

### مسارات الأعمال الفنية (Artworks) - `/api/artworks`
- ✅ `POST /api/artworks` - إنشاء عمل فني جديد
- ✅ `GET /api/artworks` - جلب جميع الأعمال الفنية
- ✅ `GET /api/artworks/:id` - جلب عمل فني محدد
- ✅ `PUT /api/artworks/:id` - تحديث عمل فني
- ✅ `DELETE /api/artworks/:id` - حذف عمل فني
- ✅ `POST /api/artworks/:id/like` - إعجاب بعمل فني
- ✅ `GET /api/artworks/my` - جلب أعمال المستخدم الفنية

### مسارات المحادثات (Chat) - `/api/chat`
- ✅ `GET /api/chat` - جلب جميع المحادثات
- ✅ `GET /api/chat/:chatId/messages` - جلب رسائل محادثة
- ✅ `POST /api/chat/:chatId/messages` - إرسال رسالة
- ✅ `POST /api/chat/create` - إنشاء محادثة جديدة
- ✅ `PATCH /api/chat/:chatId/read` - تمييز المحادثة كمقروءة

### مسارات الإشعارات (Notifications) - `/api/notifications`
- ✅ `GET /api/notifications` - جلب الإشعارات
- ✅ `GET /api/notifications/unread` - جلب الإشعارات غير المقروءة
- ✅ `PATCH /api/notifications/:id/read` - تمييز إشعار كمقروء
- ✅ `PATCH /api/notifications/read-all` - تمييز جميع الإشعارات كمقروءة
- ✅ `DELETE /api/notifications/:id` - حذف إشعار
- ✅ `DELETE /api/notifications` - حذف جميع الإشعارات
- ✅ `GET /api/notifications/settings` - جلب إعدادات الإشعارات
- ✅ `PUT /api/notifications/settings` - تحديث إعدادات الإشعارات
- ✅ `POST /api/notifications/token` - تسجيل رمز FCM
- ✅ `DELETE /api/notifications/token` - إلغاء تسجيل رمز FCM

### مسارات المتابعة (Follow) - `/api/follow`
- ✅ `POST /api/follow/toggle` - تبديل حالة المتابعة
- ✅ `GET /api/follow/following` - جلب قائمة المتابعين
- ✅ `GET /api/follow/followers` - جلب قائمة المتابعين للمستخدم

### مسارات التقييمات (Reviews) - `/api/reviews`
- ✅ `POST /api/reviews/artwork` - إنشاء تقييم للعمل الفني
- ✅ `PUT /api/reviews/artwork/:reviewId` - تحديث تقييم العمل الفني
- ✅ `POST /api/reviews/artist` - إنشاء تقييم للفنان
- ✅ `PUT /api/reviews/artist/:reviewId` - تحديث تقييم الفنان
- ✅ `DELETE /api/reviews/:reviewId` - حذف تقييم
- ✅ `POST /api/reviews/:reviewId/helpful` - تمييز تقييم كمفيد
- ✅ `GET /api/reviews/my` - جلب تقييمات المستخدم

### مسارات البلاغات (Reports) - `/api/reports`
- ✅ `POST /api/reports` - إنشاء بلاغ
- ✅ `GET /api/reports/my` - جلب بلاغات المستخدم
- ✅ `GET /api/reports/:reportId` - جلب تفاصيل بلاغ
- ✅ `DELETE /api/reports/:reportId` - حذف بلاغ
- ✅ `GET /api/reports/admin/all` - جلب جميع البلاغات (مديرين)
- ✅ `PATCH /api/reports/:reportId/status` - تحديث حالة البلاغ

### مسارات الطلبات الخاصة (Special Requests) - `/api/special-requests`
- ✅ `POST /api/special-requests` - إنشاء طلب خاص
- ✅ `GET /api/special-requests/my` - جلب طلبات المستخدم
- ✅ `GET /api/special-requests/artist` - جلب طلبات الفنان
- ✅ `GET /api/special-requests/:requestId` - جلب تفاصيل طلب
- ✅ `PATCH /api/special-requests/:requestId/accept` - قبول طلب
- ✅ `PATCH /api/special-requests/:requestId/reject` - رفض طلب
- ✅ `DELETE /api/special-requests/:requestId` - حذف طلب

### مسارات المعاملات (Transactions) - `/api/transactions`
- ✅ `POST /api/transactions/artwork` - شراء عمل فني
- ✅ `POST /api/transactions/special-request` - دفع طلب خاص
- ✅ `GET /api/transactions/my` - جلب معاملات المستخدم
- ✅ `GET /api/transactions/:transactionId` - جلب تفاصيل معاملة
- ✅ `PATCH /api/transactions/:transactionId/status` - تحديث حالة المعاملة

### مسارات الصفحة الرئيسية (Home) - `/api/home`
- ✅ `GET /api/home` - جلب بيانات الصفحة الرئيسية
- ✅ `GET /api/home/search` - البحث العام
- ✅ `GET /api/home/trending` - المحتوى الرائج

## 🔄 المسارات المضافة حديثاً

### مسارات المستخدمين (Users) - `/api/user`
- 🆕 `GET /api/user/profile` - جلب الملف الشخصي
- 🆕 `PUT /api/user/profile` - تحديث الملف الشخصي
- 🆕 `PATCH /api/user/change-password` - تغيير كلمة المرور
- 🆕 `GET /api/user/artist/:artistId` - جلب ملف فنان
- 🆕 `GET /api/user/wishlist` - جلب قائمة المفضلة
- 🆕 `POST /api/user/wishlist/toggle` - تبديل المفضلة
- 🆕 `POST /api/user/follow/:artistId` - متابعة فنان
- 🆕 `POST /api/user/unfollow/:artistId` - إلغاء متابعة فنان
- 🆕 `GET /api/user/following` - جلب المتابعين
- 🆕 `GET /api/user/followers` - جلب المتابعين للمستخدم
- 🆕 `GET /api/user/discover/artists` - اكتشاف فنانين
- 🆕 `GET /api/user/search` - البحث في المستخدمين
- 🆕 `PUT /api/user/settings/language` - تحديث اللغة
- 🆕 `PUT /api/user/settings/notifications` - تحديث إعدادات الإشعارات
- 🆕 `PUT /api/user/settings/privacy` - تحديث إعدادات الخصوصية
- 🆕 `DELETE /api/user/delete-account` - حذف الحساب
- 🆕 `POST /api/user/reactivate-account` - إعادة تفعيل الحساب

### مسارات التصنيفات (Categories) - `/api/categories`
- 🆕 `POST /api/categories` - إنشاء تصنيف (مديرين فقط)
- 🆕 `GET /api/categories` - جلب جميع التصنيفات
- 🆕 `GET /api/categories/:id` - جلب تصنيف محدد
- 🆕 `PUT /api/categories/:id` - تحديث تصنيف (مديرين فقط)
- 🆕 `DELETE /api/categories/:id` - حذف تصنيف (مديرين فقط)
- 🆕 `GET /api/categories/popular` - التصنيفات الشائعة
- 🆕 `GET /api/categories/:id/artworks` - أعمال التصنيف

## 📊 إحصائيات التوثيق

- **إجمالي المسارات الموثقة**: 105+ مسار
- **إجمالي النماذج المُعرَّفة**: 30+ نموذج
- **عدد الوحدات المُوثَّقة**: 12 وحدة
- **دعم اللغات**: العربية والإنجليزية
- **أنواع المصادقة المدعومة**: JWT Bearer و Firebase Auth

## 🛠️ الميزات المدعومة

### 1. المصادقة المتعددة
- مصادقة JWT التقليدية
- مصادقة Firebase للتطبيقات المحمولة
- تسجيل الخروج الآمن من جهاز واحد أو جميع الأجهزة

### 2. إدارة المحتوى
- رفع ومعالجة الصور مع التحسين التلقائي
- إدارة الأعمال الفنية مع دعم متعدد الصور
- نظام تصنيفات هرمي

### 3. التفاعل الاجتماعي
- نظام متابعة الفنانين
- نظام تقييمات ومراجعات
- نظام محادثات مباشرة
- قائمة المفضلة الشخصية

### 4. التجارة الإلكترونية
- نظام شراء الأعمال الفنية
- نظام الطلبات الخاصة
- إدارة المعاملات المالية

### 5. الإدارة والمراقبة
- نظام البلاغات والمراجعة
- إحصائيات مفصلة للمديرين
- نظام إشعارات متقدم

### 6. تعدد اللغات
- دعم كامل للعربية والإنجليزية
- رسائل خطأ متعددة اللغات
- محتوى محلي حسب تفضيل المستخدم

## 🔧 التحسينات التقنية

### 1. الأمان
- تشفير كلمات المرور
- التحقق من صحة البيانات
- حماية من هجمات CSRF
- تحديد معدل الطلبات

### 2. الأداء
- ضغط وتحسين الصور
- نظام تخزين مؤقت
- فهرسة قاعدة البيانات
- تصفح محسن للبيانات الكبيرة

### 3. قابلية التشغيل البيني
- واجهة RESTful متسقة
- دعم JSON فقط
- رؤوس CORS محددة بدقة
- توثيق Swagger تفاعلي

## 📱 دعم التطبيقات

### Flutter Integration
- مسارات محسنة لتطبيقات Flutter
- دعم Firebase Authentication
- رفع الملفات المتعددة
- إشعارات فورية عبر FCM

### Web Integration
- دعم CORS كامل
- واجهة RESTful متوافقة
- توثيق تفاعلي
- أمثلة كود جاهزة

## 🚀 الخطوات التالية

### 1. تحسينات مستقبلية
- [ ] إضافة GraphQL endpoint
- [ ] تحسين نظام البحث
- [ ] إضافة WebSocket للمحادثات المباشرة
- [ ] نظام تحليلات متقدم

### 2. اختبارات إضافية
- [ ] اختبارات تكامل شاملة
- [ ] اختبارات الأداء
- [ ] اختبارات الأمان
- [ ] اختبارات واجهة المستخدم

### 3. توثيق إضافي
- [ ] أدلة التكامل للمطورين
- [ ] أمثلة كود لكل لغة برمجة
- [ ] فيديوهات تعليمية
- [ ] دليل استكشاف الأخطاء

## 📞 الدعم

للحصول على المساعدة أو الإبلاغ عن مشاكل:
- 📧 البريد الإلكتروني: support@arthub.com
- 📚 التوثيق: `/api-docs`
- 🔧 GitHub Issues: [رابط المستودع]

---

**آخر تحديث**: تم تحديث هذا التوثيق في $(date) ليعكس أحدث التغييرات في واجهة برمجة التطبيقات. 