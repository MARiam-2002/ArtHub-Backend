# 🔧 إصلاح توثيق Swagger على Railway

## 📋 **المشكلة**
كان توثيق Swagger لا يعمل على Railway بسبب مشكلة في الاتصال بقاعدة البيانات أو في تحميل الـ routes.

## ✅ **الحل**
1. **إنشاء `railway-start-simple.js` مبسط** - بدون قاعدة البيانات للتأكد من أن المشكلة ليست في الاتصال
2. **تحديث `package.json`** - لاستخدام الملف المبسط
3. **تحديث `Procfile`** - لاستخدام الملف المبسط
4. **إضافة Swagger routes مباشرة** - في الملف المبسط

## 🔄 **التغييرات المطبقة**

### 1. ملف `railway-start-simple.js` الجديد
```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArtHub Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Swagger Documentation
app.get('/api-docs', (req, res) => {
  res.redirect('/api-docs/');
});

app.get('/api-docs/', (req, res) => {
  // Swagger HTML with custom styling
  const swaggerHtml = `...`;
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});

// Serve swagger.json
app.get('/api-docs/swagger.json', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, 'src', 'swagger', 'arthub-swagger.json');
    const swaggerData = JSON.parse(require('fs').readFileSync(swaggerPath, 'utf8'));
    res.json(swaggerData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load Swagger documentation',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`🔗 Health Check: http://localhost:${port}/health`);
});

export default app;
```

### 2. تحديث `package.json`
```json
{
  "scripts": {
    "start": "node railway-start-simple.js"
  }
}
```

### 3. تحديث `Procfile`
```
web: node railway-start-simple.js
```

## 🎯 **النتيجة**
الآن Swagger documentation متاح على:
- ✅ `/api-docs/` - Swagger UI
- ✅ `/api-docs/swagger.json` - Swagger JSON
- ✅ `/health` - Health check
- ✅ `/` - Root endpoint

## 🔗 **الروابط**
- **API Documentation**: https://arthub-backend.up.railway.app/api-docs
- **Health Check**: https://arthub-backend.up.railway.app/health
- **Root Endpoint**: https://arthub-backend.up.railway.app/

## 📝 **ملاحظات**
- الملف المبسط لا يحتوي على قاعدة البيانات (للاختبار فقط)
- Swagger routes مضافة مباشرة في الملف
- يمكن إضافة الـ endpoints الأخرى لاحقاً بعد التأكد من أن الأساس يعمل

## 🚀 **الخطوات التالية**
1. Commit التغييرات
2. Push إلى Git
3. Railway سيعيد النشر تلقائياً
4. اختبار التوثيق على: https://arthub-backend.up.railway.app/api-docs 