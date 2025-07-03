# 📋 دليل مرجعي سريع - ArtHub Backend

## 🚀 أوامر سريعة

```bash
# تشغيل الخادم
npm start

# تشغيل في وضع التطوير
npm run dev

# تشغيل الاختبارات
npm test

# عرض وثائق API
# افتح: http://localhost:3001/api-docs
```

## 📁 هيكل الملفات المنظم

```
ArtHub-Backend/
├── 📄 README.md                     # الدليل الرئيسي
├── 📄 QUICK_REFERENCE.md            # هذا الملف
├── 📄 CONTRIBUTING.md               # دليل المساهمة
├── 📁 src/                          # الكود المصدري
│   ├── 📁 modules/                 # وحدات النظام
│   ├── 📁 middleware/              # الوسطاء
│   ├── 📁 utils/                   # المساعدات
│   └── 📁 swagger/                 # وثائق Swagger
├── 📁 docs/                        # الوثائق المنظمة
│   ├── 📄 README.md               # فهرس الوثائق
│   ├── 📁 guides/                 # أدلة متقدمة
│   └── 📁 improvements/           # ملفات التحسينات
├── 📁 DB/                          # نماذج قاعدة البيانات
└── 📁 __tests__/                   # الاختبارات
```

## 🔗 روابط مهمة

| الوصف | الرابط |
|-------|---------|
| 📚 الوثائق الكاملة | [docs/README.md](./docs/README.md) |
| 🔐 دليل المصادقة | [docs/FLUTTER_AUTH_INTEGRATION.md](./docs/FLUTTER_AUTH_INTEGRATION.md) |
| 🛠️ دليل النشر | [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) |
| 🐛 حل المشاكل | [docs/MONGODB_TROUBLESHOOTING.md](./docs/MONGODB_TROUBLESHOOTING.md) |
| 📊 التحسينات | [docs/improvements/README.md](./docs/improvements/README.md) |
| 🧪 مجموعة Postman | [docs/POSTMAN_COLLECTION.md](./docs/POSTMAN_COLLECTION.md) |

## 🔧 متغيرات البيئة الأساسية

```env
# قاعدة البيانات
CONNECTION_URL=mongodb://localhost:27017/arthub

# JWT
TOKEN_KEY=your_jwt_secret_key_here
REFRESH_TOKEN_KEY=your_refresh_secret_key_here

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🎯 نقاط API الأساسية

### 🔐 المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/login-with-fingerprint` - دخول ببصمة الجهاز

### 🎨 الأعمال الفنية
- `GET /api/artworks` - جلب جميع الأعمال
- `POST /api/artworks` - إضافة عمل فني
- `GET /api/artworks/:id` - جلب عمل محدد

### 👥 المستخدمين
- `GET /api/users/profile` - الملف الشخصي
- `PUT /api/users/profile` - تحديث الملف الشخصي

## 🆘 مشاكل شائعة وحلولها

### خطأ في الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
mongod

# تحقق من رابط الاتصال في .env
CONNECTION_URL=mongodb://localhost:27017/arthub
```

### خطأ في JWT
```bash
# تأكد من وجود مفاتيح JWT طويلة بما فيه الكفاية
TOKEN_KEY=your_super_secret_jwt_key_here_make_it_long_and_secure_123456789
```

### خطأ في Cloudinary
```bash
# تأكد من إعداد متغيرات Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📞 الحصول على المساعدة

1. **تحقق من الوثائق**: [docs/README.md](./docs/README.md)
2. **راجع رموز الأخطاء**: [docs/ERROR_CODES.md](./docs/ERROR_CODES.md)
3. **حل مشاكل MongoDB**: [docs/MONGODB_TROUBLESHOOTING.md](./docs/MONGODB_TROUBLESHOOTING.md)
4. **أمثلة الاستجابات**: [docs/RESPONSE_EXAMPLES.md](./docs/RESPONSE_EXAMPLES.md)

---

**💡 نصيحة**: احتفظ بهذا الملف مفتوحاً أثناء التطوير للوصول السريع للمعلومات! 