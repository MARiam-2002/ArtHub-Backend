# ArtHub Backend - نظام إدارة الأعمال الفنية

## نظرة عامة
نظام backend محسن ومطور خصيصاً لتطبيق ArtHub مع التركيز على البساطة والتوافق الكامل مع Flutter.

## ✨ الميزات الرئيسية

### 🔐 نظام مصادقة محسن
- مصادقة Firebase متكاملة
- JWT tokens مع refresh tokens
- تسجيل دخول/خروج آمن
- إعادة تعيين كلمة المرور
- إدارة FCM tokens للإشعارات

### 👤 إدارة المستخدمين
- ملفات شخصية شاملة
- رفع وإدارة الصور
- إعدادات الخصوصية
- إحصائيات المستخدمين
- نظام متابعة مبسط

### 🎨 إدارة الأعمال الفنية
- رفع وعرض الأعمال الفنية
- نظام تصنيف متقدم
- تقييمات ومراجعات
- البحث والفلترة
- المفضلة والمشاركة

### 💬 نظام المراسلة
- محادثات فورية
- Socket.io integration
- رفع الصور والملفات
- حالة القراءة
- إشعارات فورية

### 📱 تصميم متوافق مع Flutter
- API endpoints مبسطة
- استجابات موحدة
- معالجة أخطاء متسقة
- توثيق Swagger شامل

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- MongoDB 5.0+
- Redis (للـ caching)
- Cloudinary account (لرفع الصور)

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd AtrtHub-Backend
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
```bash
cp .env.example .env
# قم بتحديث القيم في ملف .env
```

4. **تشغيل قاعدة البيانات**
```bash
# تأكد من تشغيل MongoDB
mongod

# تأكد من تشغيل Redis
redis-server
```

5. **تشغيل الخادم**
```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## 📚 هيكل المشروع

```
src/
├── modules/           # وحدات النظام
│   ├── auth/         # المصادقة
│   ├── user/         # المستخدمين
│   ├── artwork/      # الأعمال الفنية
│   ├── chat/         # المراسلة
│   ├── follow/       # المتابعة
│   └── image/        # إدارة الصور
├── middleware/       # Middleware functions
├── utils/           # المساعدات والأدوات
├── swagger/         # توثيق API
└── app.js          # نقطة البداية

DB/
├── models/         # نماذج قاعدة البيانات
└── connection.js   # اتصال قاعدة البيانات

__tests__/
├── unit/          # اختبارات الوحدة
└── integration/   # اختبارات التكامل
```

## 🔧 الوحدات المحسنة

### 1. وحدة المصادقة (Auth)
```javascript
// تسجيل مستخدم جديد
POST /api/auth/register

// تسجيل الدخول
POST /api/auth/login

// تسجيل دخول Firebase
POST /api/auth/firebase-login

// تجديد Token
POST /api/auth/refresh-token

// تسجيل الخروج
POST /api/auth/logout

// إعادة تعيين كلمة المرور
POST /api/auth/reset-password
```

### 2. وحدة المستخدمين (User)
```javascript
// الحصول على الملف الشخصي
GET /api/user/profile

// تحديث الملف الشخصي
PUT /api/user/profile

// رفع صورة الملف الشخصي
POST /api/user/profile-image

// البحث عن المستخدمين
GET /api/user/search

// إحصائيات المستخدم
GET /api/user/stats
```

### 3. وحدة الأعمال الفنية (Artwork)
```javascript
// إنشاء عمل فني جديد
POST /api/artwork

// الحصول على جميع الأعمال
GET /api/artwork

// الحصول على عمل محدد
GET /api/artwork/:id

// تحديث عمل فني
PUT /api/artwork/:id

// حذف عمل فني
DELETE /api/artwork/:id

// إضافة للمفضلة
POST /api/artwork/:id/favorite
```

### 4. وحدة المراسلة (Chat)
```javascript
// إنشاء محادثة جديدة
POST /api/chat/:userId

// الحصول على المحادثات
GET /api/chat

// الحصول على الرسائل
GET /api/chat/:chatId/messages

// إرسال رسالة
POST /api/chat/:chatId/messages

// تحديد كمقروءة
POST /api/chat/:chatId/read
```

### 5. وحدة المتابعة (Follow)
```javascript
// متابعة/إلغاء متابعة مستخدم
POST /api/follow/:userId

// الحصول على المتابعين
GET /api/follow/:userId/followers

// الحصول على المتابعين
GET /api/follow/:userId/following

// إحصائيات المتابعة
GET /api/follow/:userId/stats
```

## 🧪 الاختبارات

### تشغيل الاختبارات
```bash
# جميع الاختبارات
npm test

# اختبارات محددة
npm test -- auth.test.js

# مع تغطية الكود
npm run test:coverage
```

### أنواع الاختبارات
- **Unit Tests**: اختبار الوظائف المنفردة
- **Integration Tests**: اختبار API endpoints
- **Validation Tests**: اختبار التحقق من البيانات

## 📖 التوثيق

### Swagger Documentation
يمكن الوصول لتوثيق API الكامل على:
```
http://localhost:3000/api-docs
```

### استخدام API مع Flutter

#### 1. إعداد HTTP Client
```dart
class ApiClient {
  static const String baseUrl = 'http://your-server.com/api';
  static const String token = 'your-jwt-token';
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };
}
```

#### 2. مثال على تسجيل الدخول
```dart
Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('${ApiClient.baseUrl}/auth/login'),
    headers: ApiClient.headers,
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );
  
  return jsonDecode(response.body);
}
```

#### 3. مثال على رفع صورة
```dart
Future<Map<String, dynamic>> uploadImage(File image) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('${ApiClient.baseUrl}/image/upload'),
  );
  
  request.headers.addAll(ApiClient.headers);
  request.files.add(await http.MultipartFile.fromPath('image', image.path));
  
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  
  return jsonDecode(responseData);
}
```

## 🔒 الأمان

### المصادقة والتخويل
- JWT tokens مع انتهاء صلاحية
- Refresh tokens للتجديد التلقائي
- Firebase authentication integration
- Rate limiting على API endpoints

### حماية البيانات
- تشفير كلمات المرور باستخدام bcrypt
- تنظيف البيانات المدخلة
- التحقق من صحة البيانات
- حماية من SQL injection

### CORS وHeaders الأمان
- CORS محدد للنطاقات المسموحة
- Security headers (helmet.js)
- Request size limits
- File upload restrictions

## 🚀 النشر (Deployment)

### متغيرات البيئة المطلوبة
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/arthub
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FIREBASE_PROJECT_ID=your-project-id
```

### Docker Deployment
```bash
# بناء الصورة
docker build -t arthub-backend .

# تشغيل الحاوية
docker run -p 3000:3000 arthub-backend
```

### PM2 Deployment
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start ecosystem.config.js

# مراقبة التطبيق
pm2 monitor
```

## 🤝 المساهمة

### إرشادات المساهمة
1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. إنشاء Pull Request

### معايير الكود
- استخدام ESLint و Prettier
- كتابة اختبارات للميزات الجديدة
- توثيق API endpoints
- اتباع naming conventions

## 📞 الدعم والتواصل

### الحصول على المساعدة
- إنشاء Issue على GitHub
- مراجعة التوثيق
- التحقق من الاختبارات

### المشاكل الشائعة
1. **خطأ اتصال قاعدة البيانات**: تأكد من تشغيل MongoDB
2. **خطأ Firebase**: تحقق من إعدادات Firebase
3. **خطأ رفع الصور**: تأكد من إعدادات Cloudinary

## 📄 الرخصة
هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🔄 التحديثات الأخيرة

### الإصدار 2.0.0
- ✅ تحسين شامل لجميع الوحدات
- ✅ إزالة التعقيدات غير الضرورية
- ✅ تحسين التوافق مع Flutter
- ✅ توثيق Swagger محسن
- ✅ اختبارات شاملة
- ✅ معالجة أخطاء محسنة
- ✅ أداء محسن

### ما هو جديد
- نظام مصادقة مبسط
- API endpoints موحدة
- Socket.io للمراسلة الفورية
- نظام إشعارات محسن
- رفع ملفات محسن

---

**مطور بـ ❤️ لمجتمع الفنانين العرب**
