# التحليل الشامل للمبيعات

## نظرة عامة

تم إنشاء endpoint جديد يجمع البيانات من جميع endpoints المبيعات في response واحد مع الفلترة حسب السنة.

## الـ Endpoint

```
GET /api/dashboard/sales/comprehensive
```

## المعاملات (Parameters)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|-------|
| `year` | `integer` | لا | السنة المطلوبة للتحليل (2020-2030). إذا لم يتم تحديدها، تستخدم السنة الحالية |

## مثال الاستخدام

### 1. السنة الحالية (بدون تحديد سنة)
```bash
GET /api/dashboard/sales/comprehensive
```

### 2. سنة محددة
```bash
GET /api/dashboard/sales/comprehensive?year=2024
```

## Response Structure

```json
{
  "success": true,
  "message": "تم جلب التحليل الشامل للمبيعات بنجاح",
  "data": {
    "year": 2025,
    "analytics": {
      "topSellingArtist": {
        "name": "أحمد محمد",
        "image": "https://example.com/image.jpg",
        "sales": 125000,
        "orders": 25
      },
      "totalOrders": {
        "value": 1243,
        "percentageChange": 15,
        "isPositive": true
      },
      "totalSales": {
        "value": 847392,
        "percentageChange": 12,
        "isPositive": true
      },
      "averageOrderValue": 681.57
    },
    "trends": {
      "chartData": [
        {
          "month": "يناير",
          "sales": 250000,
          "orders": 45
        },
        // ... باقي الشهور
      ],
      "summary": {
        "totalSales": 847392,
        "totalOrders": 1243,
        "averageMonthlySales": 70616
      }
    },
    "topArtists": {
      "artists": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "أحمد محمد",
          "image": "https://example.com/image.jpg",
          "job": "رسام",
          "rating": 4.5,
          "reviewsCount": 25,
          "isVerified": true,
          "sales": 125000,
          "orders": 25,
          "growth": {
            "sales": 15,
            "orders": 10,
            "isPositive": true
          }
        }
        // ... باقي الفنانين
      ],
      "total": 10
    }
  }
}
```

## الميزات

### 1. تحليل المبيعات (Analytics)
- **إجمالي المبيعات** مع نسبة النمو مقارنة بالسنة السابقة
- **إجمالي الطلبات** مع نسبة النمو
- **متوسط قيمة الطلب**
- **أفضل فنان مبيعاً** للسنة المحددة

### 2. تتبع المبيعات (Trends)
- **بيانات الرسم البياني** لجميع شهور السنة (12 شهر)
- **إحصائيات ملخصة** للمبيعات والطلبات
- **متوسط المبيعات الشهرية**

### 3. أفضل الفنانين (Top Artists)
- **أفضل 10 فنانين** مبيعاً للسنة المحددة
- **معلومات تفصيلية** لكل فنان (التقييم، عدد المراجعات، إلخ)
- **نسب النمو** مقارنة بالسنة السابقة

## الفلترة حسب السنة

- **السنة الحالية**: إذا لم يتم تحديد سنة، يتم استخدام السنة الحالية
- **سنة محددة**: يمكن تحديد أي سنة من 2020 إلى 2030
- **المقارنة**: يتم حساب النسب المئوية مقارنة بالسنة السابقة

## الأمان والصلاحيات

- **المصادقة مطلوبة**: Bearer Token
- **الصلاحيات**: Admin أو SuperAdmin فقط
- **Validation**: التحقق من صحة السنة المدخلة

## الاختبار

يمكن اختبار الـ endpoint باستخدام:

```bash
node scripts/test-comprehensive-sales.js
```

## الفوائد

1. **تقليل عدد الطلبات**: بدلاً من 3 طلبات منفصلة، طلب واحد فقط
2. **بيانات متسقة**: جميع البيانات من نفس الفترة الزمنية
3. **أداء محسن**: تقليل وقت الاستجابة
4. **سهولة الاستخدام**: واجهة موحدة للبيانات

## المقارنة مع الـ Endpoints السابقة

| الميزة | Endpoints منفصلة | Comprehensive |
|--------|------------------|---------------|
| عدد الطلبات | 3 طلبات | طلب واحد |
| الفلترة الزمنية | مختلفة لكل endpoint | موحدة حسب السنة |
| تناسق البيانات | قد يختلف | مضمون |
| سهولة الاستخدام | معقد | بسيط |

## أمثلة الاستخدام في Frontend

```javascript
// جلب البيانات للسنة الحالية
const response = await fetch('/api/dashboard/sales/comprehensive', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// جلب البيانات لسنة محددة
const response = await fetch('/api/dashboard/sales/comprehensive?year=2024', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('السنة:', data.data.year);
console.log('إجمالي المبيعات:', data.data.analytics.totalSales.value);
console.log('بيانات الرسم البياني:', data.data.trends.chartData);
console.log('أفضل الفنانين:', data.data.topArtists.artists);
``` 