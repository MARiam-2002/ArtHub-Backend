# 📚 ArtHub Backend Documentation

مرحباً بك في دليل توثيق ArtHub Backend الشامل! هذا الدليل منظم ومحدث ليساعدك في فهم واستخدام النظام بكفاءة.

## 🗂️ التنظيم الجديد

تم إعادة تنظيم الوثائق لتكون أكثر وضوحاً وسهولة في الاستخدام:

### 📡 API Documentation
- [**نقاط النهاية**](./api/endpoints.md) - دليل شامل لجميع API endpoints
- [**أمثلة الاستجابات**](./api/responses.md) - أمثلة على استجابات API
- [**رموز الأخطاء**](./api/errors.md) - جميع رموز الأخطاء ومعانيها
- [**مجموعة Postman**](./api/postman.md) - دليل استخدام مجموعة Postman

### 🔗 التكامل مع العملاء
- [**تكامل المصادقة مع Flutter**](./integration/flutter-auth.md) - دليل شامل للمصادقة
- [**تكامل Flutter العام**](./integration/flutter-general.md) - دليل عام لتكامل Flutter
- [**دردشة Flutter**](./integration/flutter-chat.md) - تنفيذ الدردشة في Flutter
- [**تكامل العملاء**](./integration/client-integration.md) - دليل شامل لتكامل العملاء
- [**ربط الشاشات بـ API**](./integration/screen-mapping.md) - ربط شاشات التطبيق بنقاط API

### 🚀 النشر والبنية التحتية
- [**نشر على Vercel**](./deployment/vercel.md) - دليل نشر المشروع على Vercel
- [**حل مشاكل MongoDB**](./deployment/mongodb-troubleshooting.md) - حل مشاكل قاعدة البيانات
- [**إصلاح MongoDB على Vercel**](./deployment/mongodb-vercel-fix.md) - إصلاحات خاصة بـ Vercel

### ⚡ الميزات المتقدمة
- [**الدردشة المباشرة**](./features/chat.md) - نظام الدردشة والرسائل المباشرة
- [**الإشعارات**](./features/notifications.md) - نظام الإشعارات المتقدم
- [**تحسين الصور**](./features/images.md) - دليل تحسين وإدارة الصور
- [**الدعم متعدد اللغات**](./features/multilingual.md) - إعداد الدعم متعدد اللغات

### 🔧 التطوير والتحسينات
- [**التحسينات العامة**](./development/improvements.md) - ملخص التحسينات المطبقة
- [**تحسينات الوحدات**](./development/modules-improvements.md) - تحسينات مفصلة لكل وحدة

## 🚀 البدء السريع

1. **تثبيت المتطلبات**:
   ```bash
   npm install
   ```

2. **إعداد متغيرات البيئة**:
   ```bash
   cp .env.example .env
   # قم بتعديل متغيرات البيئة
   ```

3. **تشغيل الخادم**:
   ```bash
   npm start
   ```

4. **عرض الوثائق**:
   - Swagger UI: `http://localhost:3001/api-docs`
   - وثائق API: هذا المجلد

## 📝 هيكل المشروع

```
ArtHub-Backend/
├── src/                    # الكود المصدري
│   ├── modules/           # وحدات النظام
│   ├── middleware/        # الوسطاء
│   ├── utils/            # المساعدات
│   └── swagger/          # وثائق Swagger
├── docs/                 # الوثائق (هذا المجلد)
│   ├── guides/          # أدلة متقدمة
│   └── utils/           # أدوات الوثائق
├── DB/                  # نماذج قاعدة البيانات
└── __tests__/          # الاختبارات
```

## 🤝 المساهمة

اقرأ [دليل المساهمة](../CONTRIBUTING.md) لمعرفة كيفية المساهمة في المشروع.

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من [رموز الأخطاء](./ERROR_CODES.md)
2. راجع [حل مشاكل MongoDB](./MONGODB_TROUBLESHOOTING.md)
3. اطلع على [أمثلة الاستجابات](./RESPONSE_EXAMPLES.md)

---

**آخر تحديث**: يناير 2025
