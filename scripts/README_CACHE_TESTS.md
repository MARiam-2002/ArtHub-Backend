# دليل اختبارات نظام التخزين المؤقت Redis

## 🧪 الاختبارات المتاحة

### 1. اختبار المحاكاة (بدون Redis)
```bash
node scripts/test-cache-mock.js
```
**الوصف**: اختبار شامل لمنطق التخزين المؤقت بدون الحاجة لـ Redis
**النتيجة**: ✅ 17/17 اختبار نجح (100%)

### 2. اختبار Redis الحقيقي
```bash
node scripts/test-redis-caching.js
```
**الوصف**: اختبار اتصال Redis والعمليات الأساسية
**المتطلبات**: Redis server يعمل

### 3. اختبار شامل
```bash
node scripts/test-cache-comprehensive.js
```
**الوصف**: اختبار شامل لجميع ميزات التخزين المؤقت
**المتطلبات**: Redis server يعمل

## 🚀 تشغيل سريع

### بدون Redis (محاكاة)
```bash
# اختبار سريع للمنطق
node scripts/test-cache-mock.js
```

### مع Redis
```bash
# 1. تشغيل Redis
redis-server

# 2. اختبار الاتصال
node scripts/test-redis-caching.js

# 3. اختبار شامل
node scripts/test-cache-comprehensive.js
```

## 📊 نتائج الاختبارات

### اختبار المحاكاة
```
📊 Test Results Summary
Total Tests: 17
Passed: 17
Failed: 0
Success Rate: 100.0%
Hit Rate: 86.0%
```

### اختبارات شاملة
- ✅ العمليات الأساسية
- ✅ انتهاء الصلاحية
- ✅ البيانات المعقدة
- ✅ التخزين مع الاسترجاع
- ✅ مساعدات متخصصة
- ✅ إبطال التخزين المؤقت
- ✅ الأداء والسرعة
- ✅ التزامن
- ✅ معالجة الأخطاء
- ✅ الإحصائيات

## 🔧 استكشاف الأخطاء

### Redis غير متاح
```bash
# تثبيت Redis على Windows
choco install redis-64

# تشغيل Redis
redis-server
```

### مشاكل الاتصال
```bash
# فحص Redis
redis-cli ping
# يجب أن ترى: PONG
```

### اختبار سريع
```bash
# اختبار اتصال سريع
node -e "
import('./src/utils/redis.js').then(m => 
  m.testRedisConnection()
).then(r => console.log('Redis:', r ? 'Connected' : 'Failed'))
"
```

## 📈 مراقبة الأداء

### إحصائيات التخزين المؤقت
```javascript
import { getCacheStats } from './src/utils/cache.js';
const stats = await getCacheStats();
console.log('Hit Rate:', stats.hitRate);
```

### مراقبة Redis
```bash
# مراقبة Redis
redis-cli monitor

# إحصائيات Redis
redis-cli info
```

---

**💡 نصيحة**: ابدأ باختبار المحاكاة للتأكد من صحة المنطق، ثم انتقل لاختبار Redis الحقيقي.
