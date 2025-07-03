# ArtHub Backend API

🎨 **منصة ArtHub** - نظام إدارة الأعمال الفنية والفنانين

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)

## 📖 نظرة عامة

ArtHub Backend هو نظام إدارة شامل للأعمال الفنية والفنانين، يوفر واجهة برمجية متقدمة لإدارة:

- 🔐 **المصادقة والأمان** - نظام مصادقة متعدد الطرق (JWT, Firebase, بصمة الجهاز)
- 🎨 **إدارة الأعمال الفنية** - عرض وإدارة الأعمال الفنية مع تحسين الصور
- 👥 **إدارة المستخدمين** - فنانين وعملاء مع ملفات شخصية متقدمة
- 💬 **نظام الدردشة** - دردشة فورية مع Socket.IO
- 💰 **المعاملات المالية** - نظام دفع وفوترة متكامل
- 📱 **الإشعارات** - نظام إشعارات متعدد اللغات
- 🌐 **دعم متعدد اللغات** - العربية والإنجليزية

## 🚀 البدء السريع

### المتطلبات
- Node.js 18.x أو أحدث
- MongoDB 6.x أو أحدث
- npm أو yarn

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/your-username/arthub-backend.git
cd arthub-backend

# تثبيت المتطلبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل متغيرات البيئة في ملف .env

# تشغيل الخادم
npm start
```

### متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
CONNECTION_URL=mongodb://localhost:27017/arthub

# مفاتيح JWT
TOKEN_KEY=your_super_secret_jwt_key_here
REFRESH_TOKEN_KEY=your_super_secret_refresh_token_key_here

# Cloudinary (للصور)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase (اختياري)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## 📚 الوثائق

### 🔗 روابط مهمة
- **واجهة Swagger**: `http://localhost:3001/api-docs`
- **الوثائق الكاملة**: [docs/README.md](./docs/README.md)
- **دليل Flutter**: [docs/FLUTTER_AUTH_INTEGRATION.md](./docs/FLUTTER_AUTH_INTEGRATION.md)

### 📋 أدلة سريعة
- [دليل التثبيت والإعداد](./docs/VERCEL_DEPLOYMENT.md)
- [حل مشاكل MongoDB](./docs/MONGODB_TROUBLESHOOTING.md)
- [مجموعة Postman](./docs/POSTMAN_COLLECTION.md)
- [رموز الأخطاء](./docs/ERROR_CODES.md)

## 🔧 الميزات الرئيسية

### 🔐 نظام المصادقة المتقدم
- **مصادقة متعددة الطرق**: JWT, Firebase, بصمة الجهاز
- **إدارة الجلسات**: تسجيل دخول متعدد الأجهزة
- **الأمان**: حماية ضد CSRF, XSS, Rate Limiting
- **إعادة تعيين كلمة المرور**: عبر البريد الإلكتروني

### 🎨 إدارة الأعمال الفنية
- **رفع الصور**: تحسين تلقائي مع Cloudinary
- **التصنيفات**: تنظيم الأعمال حسب النوع
- **البحث المتقدم**: بحث بالكلمات المفتاحية والفلاتر
- **التقييمات**: نظام تقييم ومراجعات

### 💬 نظام الدردشة الفوري
- **Socket.IO**: رسائل فورية
- **الملفات**: إرسال الصور والملفات
- **الحالة**: متصل/غير متصل
- **التاريخ**: حفظ تاريخ المحادثات

### 📱 تكامل Flutter
- **أمثلة كاملة**: كود Flutter جاهز للاستخدام
- **إدارة الحالة**: مع Provider/Riverpod
- **معالجة الأخطاء**: رسائل خطأ باللغة العربية
- **التحديث التلقائي**: للرموز المميزة

## 🏗️ هيكل المشروع

```
ArtHub-Backend/
├── 📁 src/                    # الكود المصدري
│   ├── 📁 modules/           # وحدات النظام
│   │   ├── 📁 auth/         # المصادقة
│   │   ├── 📁 user/         # المستخدمين
│   │   ├── 📁 artwork/      # الأعمال الفنية
│   │   ├── 📁 chat/         # الدردشة
│   │   └── 📁 ...           # وحدات أخرى
│   ├── 📁 middleware/        # الوسطاء
│   ├── 📁 utils/            # المساعدات
│   └── 📁 swagger/          # وثائق API
├── 📁 docs/                  # الوثائق
│   ├── 📁 guides/           # أدلة متقدمة
│   └── 📁 improvements/     # ملفات التحسينات
├── 📁 DB/                   # نماذج قاعدة البيانات
├── 📁 __tests__/           # الاختبارات
└── 📄 README.md            # هذا الملف
```

## 🔗 نقاط API الرئيسية

### المصادقة
```
POST /api/auth/register              # تسجيل مستخدم جديد
POST /api/auth/login                 # تسجيل الدخول
POST /api/auth/login-with-fingerprint # دخول ببصمة الجهاز
POST /api/auth/refresh-token         # تحديث الرمز المميز
POST /api/auth/logout               # تسجيل الخروج
```

### الأعمال الفنية
```
GET  /api/artworks                  # جلب جميع الأعمال
POST /api/artworks                  # إضافة عمل فني
GET  /api/artworks/:id              # جلب عمل محدد
PUT  /api/artworks/:id              # تحديث عمل فني
DELETE /api/artworks/:id            # حذف عمل فني
```

### المستخدمين
```
GET  /api/users/profile             # الملف الشخصي
PUT  /api/users/profile             # تحديث الملف الشخصي
POST /api/users/follow/:id          # متابعة مستخدم
GET  /api/users/search              # البحث عن مستخدمين
```

## 🧪 الاختبار

```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات الوحدة
npm run test:unit

# اختبارات التكامل
npm run test:integration

# تغطية الكود
npm run test:coverage
```

## 🚀 النشر

### Vercel (موصى به)
```bash
# تثبيت Vercel CLI
npm i -g vercel

# نشر المشروع
vercel --prod
```

### Docker
```bash
# بناء الصورة
docker build -t arthub-backend .

# تشغيل الحاوية
docker run -p 3001:3001 arthub-backend
```

## 🤝 المساهمة

نرحب بجميع المساهمات! يرجى قراءة [دليل المساهمة](./CONTRIBUTING.md) قبل البدء.

### خطوات المساهمة
1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📞 الدعم

### الحصول على المساعدة
- 📖 [الوثائق الكاملة](./docs/README.md)
- 🐛 [الإبلاغ عن خطأ](https://github.com/your-username/arthub-backend/issues)
- 💬 [مناقشات المجتمع](https://github.com/your-username/arthub-backend/discussions)

### مشاكل شائعة
- [حل مشاكل MongoDB](./docs/MONGODB_TROUBLESHOOTING.md)
- [رموز الأخطاء](./docs/ERROR_CODES.md)
- [مشاكل النشر](./docs/VERCEL_DEPLOYMENT.md)

## 📜 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 👥 الفريق

- **المطور الرئيسي**: [اسمك](https://github.com/your-username)
- **المساهمون**: [قائمة المساهمين](https://github.com/your-username/arthub-backend/contributors)

---

<div align="center">

**صنع بـ ❤️ للمجتمع الفني العربي**

[الوثائق](./docs/README.md) • [API Reference](http://localhost:3001/api-docs) • [دليل Flutter](./docs/FLUTTER_AUTH_INTEGRATION.md)

</div>
