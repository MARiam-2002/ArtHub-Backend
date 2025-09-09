# تحسين فهرسة قاعدة البيانات لصفحة الهوم

## الفهرس المطلوب لتحسين الأداء

### 1. فهرسة جدول الأعمال الفنية (artworks)
```javascript
// فهرسة أساسية للأداء
db.artworks.createIndex({ "isAvailable": 1, "isDeleted": 1 })
db.artworks.createIndex({ "isFeatured": 1, "isAvailable": 1 })
db.artworks.createIndex({ "category": 1, "isAvailable": 1 })
db.artworks.createIndex({ "artist": 1, "isAvailable": 1 })
db.artworks.createIndex({ "likeCount": -1, "viewCount": -1 })
db.artworks.createIndex({ "averageRating": -1, "reviewsCount": -1 })
db.artworks.createIndex({ "createdAt": -1 })
db.artworks.createIndex({ "reviewsCount": 1, "averageRating": -1 })

// فهرسة مركبة للاستعلامات المعقدة
db.artworks.createIndex({ 
  "isAvailable": 1, 
  "isFeatured": 1, 
  "likeCount": -1, 
  "viewCount": -1 
})

db.artworks.createIndex({ 
  "isAvailable": 1, 
  "reviewsCount": 1, 
  "averageRating": -1 
})

db.artworks.createIndex({ 
  "category": 1, 
  "isAvailable": 1, 
  "createdAt": -1 
})
```

### 2. فهرسة جدول المستخدمين (users)
```javascript
// فهرسة أساسية للأداء
db.users.createIndex({ "role": 1, "isActive": 1, "isDeleted": 1 })
db.users.createIndex({ "role": 1, "isActive": 1, "createdAt": -1 })
db.users.createIndex({ "isVerified": 1, "role": 1 })

// فهرسة مركبة للفنانين
db.users.createIndex({ 
  "role": 1, 
  "isActive": 1, 
  "isDeleted": 1, 
  "createdAt": -1 
})
```

### 3. فهرسة جدول التقييمات (reviews)
```javascript
// فهرسة أساسية للأداء
db.reviews.createIndex({ "artist": 1, "status": 1 })
db.reviews.createIndex({ "artwork": 1, "status": 1 })
db.reviews.createIndex({ "status": 1, "createdAt": -1 })
db.reviews.createIndex({ "rating": -1, "status": 1 })

// فهرسة مركبة للاستعلامات المعقدة
db.reviews.createIndex({ 
  "artist": 1, 
  "status": 1, 
  "createdAt": -1 
})

db.reviews.createIndex({ 
  "artwork": 1, 
  "status": 1, 
  "rating": -1 
})
```

### 4. فهرسة جدول المتابعات (follows)
```javascript
// فهرسة أساسية للأداء
db.follows.createIndex({ "follower": 1, "following": 1 })
db.follows.createIndex({ "following": 1 })
db.follows.createIndex({ "follower": 1 })
```

### 5. فهرسة جدول التصنيفات (categories)
```javascript
// فهرسة أساسية للأداء
db.categories.createIndex({ "isActive": 1 })
db.categories.createIndex({ "createdAt": -1 })
```

### 6. فهرسة جدول الطلبات الخاصة (specialrequests)
```javascript
// فهرسة أساسية للأداء
db.specialrequests.createIndex({ "status": 1, "isDeleted": 1 })
db.specialrequests.createIndex({ "artist": 1, "status": 1 })
db.specialrequests.createIndex({ "createdAt": -1, "status": 1 })
db.specialrequests.createIndex({ "status": 1, "createdAt": -1 })

// فهرسة مركبة للاستعلامات المعقدة
db.specialrequests.createIndex({ 
  "status": 1, 
  "isDeleted": 1, 
  "createdAt": -1 
})

db.specialrequests.createIndex({ 
  "artist": 1, 
  "status": 1, 
  "createdAt": -1 
})
```

## تطبيق الفهرسة

### 1. إنشاء سكريبت الفهرسة
```javascript
// scripts/create-performance-indexes.js
const mongoose = require('mongoose');

async function createPerformanceIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    console.log('🚀 Creating performance indexes...');
    
    // فهرسة الأعمال الفنية
    await db.collection('artworks').createIndex({ "isAvailable": 1, "isDeleted": 1 });
    await db.collection('artworks').createIndex({ "isFeatured": 1, "isAvailable": 1 });
    await db.collection('artworks').createIndex({ "category": 1, "isAvailable": 1 });
    await db.collection('artworks').createIndex({ "artist": 1, "isAvailable": 1 });
    await db.collection('artworks').createIndex({ "likeCount": -1, "viewCount": -1 });
    await db.collection('artworks').createIndex({ "averageRating": -1, "reviewsCount": -1 });
    await db.collection('artworks').createIndex({ "createdAt": -1 });
    await db.collection('artworks').createIndex({ "reviewsCount": 1, "averageRating": -1 });
    
    // فهرسة مركبة للأعمال الفنية
    await db.collection('artworks').createIndex({ 
      "isAvailable": 1, 
      "isFeatured": 1, 
      "likeCount": -1, 
      "viewCount": -1 
    });
    
    await db.collection('artworks').createIndex({ 
      "isAvailable": 1, 
      "reviewsCount": 1, 
      "averageRating": -1 
    });
    
    await db.collection('artworks').createIndex({ 
      "category": 1, 
      "isAvailable": 1, 
      "createdAt": -1 
    });
    
    // فهرسة المستخدمين
    await db.collection('users').createIndex({ "role": 1, "isActive": 1, "isDeleted": 1 });
    await db.collection('users').createIndex({ "role": 1, "isActive": 1, "createdAt": -1 });
    await db.collection('users').createIndex({ "isVerified": 1, "role": 1 });
    
    // فهرسة مركبة للمستخدمين
    await db.collection('users').createIndex({ 
      "role": 1, 
      "isActive": 1, 
      "isDeleted": 1, 
      "createdAt": -1 
    });
    
    // فهرسة التقييمات
    await db.collection('reviews').createIndex({ "artist": 1, "status": 1 });
    await db.collection('reviews').createIndex({ "artwork": 1, "status": 1 });
    await db.collection('reviews').createIndex({ "status": 1, "createdAt": -1 });
    await db.collection('reviews').createIndex({ "rating": -1, "status": 1 });
    
    // فهرسة مركبة للتقييمات
    await db.collection('reviews').createIndex({ 
      "artist": 1, 
      "status": 1, 
      "createdAt": -1 
    });
    
    await db.collection('reviews').createIndex({ 
      "artwork": 1, 
      "status": 1, 
      "rating": -1 
    });
    
    // فهرسة المتابعات
    await db.collection('follows').createIndex({ "follower": 1, "following": 1 });
    await db.collection('follows').createIndex({ "following": 1 });
    await db.collection('follows').createIndex({ "follower": 1 });
    
    // فهرسة التصنيفات
    await db.collection('categories').createIndex({ "isActive": 1 });
    await db.collection('categories').createIndex({ "createdAt": -1 });
    
    // فهرسة الطلبات الخاصة
    await db.collection('specialrequests').createIndex({ "status": 1, "isDeleted": 1 });
    await db.collection('specialrequests').createIndex({ "artist": 1, "status": 1 });
    await db.collection('specialrequests').createIndex({ "createdAt": -1, "status": 1 });
    await db.collection('specialrequests').createIndex({ "status": 1, "createdAt": -1 });
    
    // فهرسة مركبة للطلبات الخاصة
    await db.collection('specialrequests').createIndex({ 
      "status": 1, 
      "isDeleted": 1, 
      "createdAt": -1 
    });
    
    await db.collection('specialrequests').createIndex({ 
      "artist": 1, 
      "status": 1, 
      "createdAt": -1 
    });
    
    console.log('✅ Performance indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createPerformanceIndexes();
```

### 2. تشغيل سكريبت الفهرسة
```bash
# تشغيل سكريبت الفهرسة
node scripts/create-performance-indexes.js
```

## فوائد الفهرسة

### 1. تحسين سرعة الاستعلامات
- تقليل وقت البحث من ثوانٍ إلى ميلي ثوانٍ
- تحسين أداء aggregation pipelines
- تسريع عمليات الفرز والفلترة

### 2. تحسين استخدام الذاكرة
- تقليل استهلاك RAM
- تحسين أداء MongoDB
- تقليل I/O operations

### 3. تحسين تجربة المستخدم
- تحميل أسرع لصفحة الهوم
- استجابة أسرع للتطبيق
- تقليل وقت الانتظار

## مراقبة الأداء

### 1. مراقبة استخدام الفهارس
```javascript
// مراقبة استخدام الفهارس
db.artworks.aggregate([
  { $indexStats: {} }
])
```

### 2. تحليل أداء الاستعلامات
```javascript
// تحليل أداء الاستعلام
db.artworks.find({ isAvailable: true, isFeatured: true }).explain("executionStats")
```

### 3. مراقبة الأداء العام
```javascript
// مراقبة الأداء العام
db.runCommand({ serverStatus: 1 })
```

## نصائح إضافية

### 1. صيانة الفهارس
- مراقبة حجم الفهارس
- حذف الفهارس غير المستخدمة
- تحديث الفهارس بانتظام

### 2. تحسين الاستعلامات
- استخدام الفهارس المناسبة
- تجنب full collection scans
- تحسين aggregation pipelines

### 3. مراقبة الأداء
- مراقبة بطء الاستعلامات
- تحليل استخدام الفهارس
- تحسين الأداء المستمر
