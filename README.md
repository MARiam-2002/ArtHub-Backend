# ArtHub Backend API

## نظرة عامة

ArtHub هو نظام إدارة الأعمال الفنية والمنصات الإبداعية. يوفر النظام واجهة برمجة تطبيقات (API) شاملة لإدارة المستخدمين، الأعمال الفنية، الفنانين، والمديرين.

## الميزات الرئيسية

### 🎨 إدارة الأعمال الفنية
- رفع وإدارة الأعمال الفنية
- تصنيفات متعددة
- نظام تقييم ومراجعات
- إدارة المبيعات والمعاملات

### 👥 إدارة المستخدمين
- تسجيل دخول متعدد الطرق (بريد إلكتروني، Google، Facebook)
- ملفات شخصية شاملة
- نظام متابعة الفنانين
- إشعارات فورية

### 💬 نظام المحادثات
- محادثات مباشرة بين المستخدمين
- إرسال واستقبال الرسائل
- إشعارات فورية للمحادثات

### 🏪 نظام الطلبات الخاصة
- طلبات أعمال فنية مخصصة
- نظام عروض الأسعار
- تتبع حالة الطلبات

### 📊 نظام إدارة الأدمن
- **SuperAdmin**: إدارة جميع المديرين والمستخدمين
- **Admin**: إدارة المستخدمين والأعمال الفنية
- تسجيل دخول منفصل للداشبورد
- إدارة الصلاحيات والأدوار

## الإعداد السريع

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# إنشاء SuperAdmin افتراضي
node scripts/create-superadmin.js
```

### 3. تشغيل الخادم
```bash
npm start
```

## نظام إدارة الأدمن

### الأدوار المتاحة
- **SuperAdmin**: المدير العام - يمكنه إدارة جميع المديرين
- **Admin**: مدير عادي - يمكنه إدارة المستخدمين والأعمال الفنية

### بيانات تسجيل الدخول الافتراضية
- **البريد الإلكتروني**: `superadmin@arthub.com`
- **كلمة المرور**: `SuperAdmin123!`

### النقاط المتاحة

#### للمدير العام (SuperAdmin)
- `POST /api/v1/admin/login` - تسجيل دخول الأدمن
- `GET /api/v1/admin/admins` - جلب قائمة المديرين
- `POST /api/v1/admin/admins` - إنشاء مدير جديد
- `PUT /api/v1/admin/admins/:id` - تحديث بيانات المدير
- `DELETE /api/v1/admin/admins/:id` - حذف المدير
- `PUT /api/v1/admin/admins/:id/change-password` - تغيير كلمة مرور المدير

#### للمديرين (Admin & SuperAdmin)
- `GET /api/v1/admin/profile` - جلب الملف الشخصي
- `PUT /api/v1/admin/profile` - تحديث الملف الشخصي
- `PUT /api/v1/admin/change-password` - تغيير كلمة المرور الشخصية
- `GET /api/v1/admin/users` - جلب قائمة المستخدمين

## النقاط الرئيسية

### 🔐 المصادقة
- `POST /api/v1/auth/register` - تسجيل مستخدم جديد
- `POST /api/v1/auth/login` - تسجيل دخول
- `POST /api/v1/auth/forget-password` - نسيان كلمة المرور
- `POST /api/v1/auth/verify-forget-code` - التحقق من رمز النسيان
- `POST /api/v1/auth/reset-password` - إعادة تعيين كلمة المرور

### 🏠 الصفحة الرئيسية
- `GET /api/v1/home` - بيانات الصفحة الرئيسية
- `GET /api/v1/home/search` - البحث في الأعمال والفنانين
- `GET /api/v1/home/artwork/:id` - تفاصيل العمل الفني
- `GET /api/v1/home/artist/:id` - ملف الفنان

### 👤 المستخدمين
- `GET /api/v1/user/profile` - الملف الشخصي
- `PUT /api/v1/user/profile` - تحديث الملف الشخصي
- `GET /api/v1/user/wishlist` - قائمة المفضلة
- `POST /api/v1/user/wishlist/:artworkId` - إضافة للمفضلة

### 🎨 الأعمال الفنية
- `GET /api/v1/artwork` - قائمة الأعمال الفنية
- `POST /api/v1/artwork` - إنشاء عمل فني جديد
- `PUT /api/v1/artwork/:id` - تحديث العمل الفني
- `DELETE /api/v1/artwork/:id` - حذف العمل الفني

### 💬 المحادثات
- `GET /api/v1/chat` - قائمة المحادثات
- `POST /api/v1/chat` - إنشاء محادثة جديدة
- `GET /api/v1/chat/:id/messages` - رسائل المحادثة
- `POST /api/v1/chat/:id/messages` - إرسال رسالة

## التوثيق

- [دليل API الشامل](docs/api/)
- [دليل إدارة الأدمن](docs/api/admin-dashboard.md)
- [دليل التكامل مع Flutter](docs/integration/)
- [دليل النشر](docs/deployment/)

## 📝 التحديثات الأخيرة

### 🎨 تحديث API الأعمال الفنية (يناير 2024)
- **استخدام اسم الفئة بدلاً من المعرف:** تم تحديث API لاستخدام اسم الفئة في إنشاء الأعمال الفنية والبحث عنها
- **تحسين تجربة المستخدم:** واجهة أكثر بديهية وسهولة في الاستخدام
- **دعم البحث المتقدم:** إمكانية البحث بالاسم مع معالجة الأخطاء المحسنة

**📚 المزيد من التفاصيل:**
- [ملخص التحديثات](CATEGORY_NAME_UPDATE_SUMMARY.md)
- [دليل الاستخدام الجديد](docs/api/artwork-category-name-update.md)
- [تحديثات API](docs/api/endpoints.md#artworks)

## البيئات

### التطوير
```bash
NODE_ENV=development npm start
```

### الإنتاج
```bash
NODE_ENV=production npm start
```

## المتغيرات البيئية

```env
NODE_ENV=development
CONNECTION_URL=mongodb://localhost:27017/arthub
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل اختبارات محددة
npm test -- --testNamePattern="auth"
```

## النشر

### Vercel
```bash
vercel --prod
```

### Docker
```bash
docker build -t arthub-backend .
docker run -p 3000:3000 arthub-backend
```

## المساهمة

يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) للمزيد من المعلومات.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للمساعدة والدعم، يرجى فتح issue في GitHub أو التواصل مع فريق التطوير.
