# المسارات المفقودة في توثيق Swagger

## مسارات المستخدمين (User Routes) - `/api/user`

### مسارات الملف الشخصي
- `GET /api/user/profile` - جلب الملف الشخصي للمستخدم الحالي
- `PUT /api/user/profile` - تحديث الملف الشخصي
- `PATCH /api/user/change-password` - تغيير كلمة المرور
- `GET /api/user/artist/:artistId` - جلب ملف فنان محدد

### مسارات قائمة المفضلة
- `GET /api/user/wishlist` - جلب قائمة المفضلة
- `POST /api/user/wishlist/toggle` - إضافة/إزالة عمل فني من المفضلة

### مسارات المتابعة
- `POST /api/user/follow/:artistId` - متابعة فنان
- `POST /api/user/unfollow/:artistId` - إلغاء متابعة فنان
- `GET /api/user/following` - جلب قائمة المتابعين
- `GET /api/user/followers` - جلب قائمة المتابعين للمستخدم

### مسارات الاكتشاف والبحث
- `GET /api/user/discover/artists` - اكتشاف فنانين جدد
- `GET /api/user/search` - البحث في المستخدمين

### مسارات الإعدادات
- `PUT /api/user/settings/language` - تحديث تفضيل اللغة
- `PUT /api/user/settings/notifications` - تحديث إعدادات الإشعارات
- `PUT /api/user/settings/privacy` - تحديث إعدادات الخصوصية

### مسارات إدارة الحساب
- `DELETE /api/user/delete-account` - حذف الحساب
- `POST /api/user/reactivate-account` - إعادة تفعيل الحساب

## مسارات التصنيفات (Categories) - `/api/categories`

### إدارة التصنيفات
- `POST /api/categories` - إنشاء تصنيف جديد (مديرين فقط)
- `GET /api/categories` - جلب جميع التصنيفات
- `GET /api/categories/:id` - جلب تصنيف محدد
- `PUT /api/categories/:id` - تحديث تصنيف (مديرين فقط)
- `DELETE /api/categories/:id` - حذف تصنيف (مديرين فقط)

### إحصائيات التصنيفات
- `GET /api/categories/popular` - جلب التصنيفات الشائعة
- `GET /api/categories/:id/artworks` - جلب الأعمال الفنية لتصنيف محدد

## مسارات الصور المحدثة (Updated Image Routes)

### مسارات جديدة مفقودة
- `GET /api/image/my-images` - جلب صور المستخدم الحالي
- `GET /api/image/:imageId/download` - تحميل صورة
- `GET /api/image/search` - البحث في الصور
- `GET /api/image/categories/popular` - جلب التصنيفات الشائعة للصور

## مسارات المراجعات المحدثة (Updated Review Routes)

### مسارات Firebase
- `POST /api/reviews/artwork` - إنشاء مراجعة للعمل الفني (Firebase)
- `PUT /api/reviews/artwork/:reviewId` - تحديث مراجعة العمل الفني (Firebase)
- `POST /api/reviews/artist` - إنشاء مراجعة للفنان (Firebase)
- `PUT /api/reviews/artist/:reviewId` - تحديث مراجعة الفنان (Firebase)
- `DELETE /api/reviews/:reviewId` - حذف مراجعة (Firebase)
- `POST /api/reviews/:reviewId/helpful` - تمييز مراجعة كمفيدة (Firebase)
- `POST /api/reviews/:reviewId/report` - الإبلاغ عن مراجعة (Firebase)
- `GET /api/reviews/my` - جلب مراجعات المستخدم (Firebase)
- `GET /api/reviews/admin/stats` - إحصائيات المراجعات (Firebase)
- `PATCH /api/reviews/:reviewId/moderate` - إدارة المراجعة (Firebase)

## مسارات الإشعارات المحدثة (Updated Notification Routes)

### مسارات رموز FCM
- `POST /api/notifications/token` - تسجيل رمز FCM
- `DELETE /api/notifications/token` - إلغاء تسجيل رمز FCM
- `POST /api/notifications/token/firebase` - تسجيل رمز FCM (Firebase)
- `DELETE /api/notifications/token/firebase` - إلغاء تسجيل رمز FCM (Firebase)

### إدارة الإشعارات
- `GET /api/notifications/settings` - جلب إعدادات الإشعارات
- `PUT /api/notifications/settings` - تحديث إعدادات الإشعارات
- `PATCH /api/notifications/read-all` - تمييز جميع الإشعارات كمقروءة
- `DELETE /api/notifications` - حذف جميع الإشعارات

## المسارات التي تحتاج تحديث في التوثيق

### مسارات المصادقة
- تحديث مسار `/api/auth/logout` - تسجيل الخروج
- تحديث مسار `/api/auth/logout-all` - تسجيل الخروج من جميع الأجهزة

### مسارات المتابعة المحدثة
- تحديث مسار `/api/follow/toggle` - تبديل حالة المتابعة

## النماذج المفقودة في Swagger Definition

### نماذج المستخدمين
- `UpdateProfileRequest`
- `ChangePasswordRequest`
- `WishlistItem`
- `FollowResponse`
- `UserSearchResponse`

### نماذج التصنيفات
- `Category`
- `CreateCategoryRequest`
- `UpdateCategoryRequest`
- `CategoryResponse`

### نماذج الأعمال الفنية المحدثة
- `ArtworkResponse` (محدث)
- `CreateArtworkRequest` (محدث)

### نماذج المحادثات
- `ChatResponse`
- `MessageResponse`
- `SendMessageRequest`

### نماذج الإشعارات
- `NotificationResponse`
- `NotificationSettings`
- `FCMTokenRequest`

### نماذج التصفح
- `PaginationResponse`

## ملاحظات التحديث

1. **إضافة مسار Categories إلى الروتر الرئيسي** ✅ تم
2. **إضافة مسار User إلى الروتر الرئيسي** ✅ تم
3. **إضافة النماذج المفقودة إلى swagger-definition.js** ✅ تم جزئياً
4. **تحديث ملفات JSON و YAML للـ Swagger** - مطلوب
5. **إضافة التوثيق للمسارات المفقودة في الروترز** - مطلوب

## الخطوات التالية

1. تحديث ملف `swagger.json` ليشمل جميع المسارات الجديدة
2. تحديث ملف `swagger.yaml` ليشمل جميع المسارات الجديدة
3. إضافة توثيق Swagger للمسارات المفقودة في ملفات الروتر
4. اختبار التوثيق للتأكد من صحته
5. تحديث الأمثلة والاستجابات 