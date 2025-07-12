# رفع الصور عند إنشاء عمل فني

## نظرة عامة

عند إنشاء عمل فني جديد، يمكن رفع الصور مباشرة مع البيانات الأخرى. يستخدم API `multipart/form-data` لرفع الملفات.

## Endpoint

```
POST /api/artworks
```

## التوثيق في Swagger

تم تحديث توثيق Swagger ليشمل:

1. **Schema جديد**: `CreateArtworkRequest` يوضح جميع الحقول المطلوبة
2. **توثيق مفصل للصور**: يوضح المتطلبات والقيود
3. **أمثلة عملية**: توضح كيفية استخدام API
4. **استجابات إضافية**: مثل خطأ حجم الملفات الكبير

## متطلبات الصور

- **الصيغ المدعومة**: JPG, PNG, GIF, WEBP
- **الحد الأقصى لحجم الصورة**: 5MB
- **عدد الصور**: من 1 إلى 10 صور
- **التحسين التلقائي**: سيتم تحسين الصور تلقائياً

## مثال على الاستخدام

### باستخدام cURL

```bash
curl -X POST "https://arthub-api.vercel.app/api/artworks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=لوحة المناظر الطبيعية" \
  -F "description=لوحة جميلة تصور المناظر الطبيعية الخلابة" \
  -F "price=500" \
  -F "category=60d0fe4f5311236168a109ca" \
  -F "tags[]=طبيعة" \
  -F "tags[]=رسم" \
  -F "tags[]=زيتي" \
  -F "status=available" \
  -F "isFramed=true" \
  -F "dimensions[width]=60" \
  -F "dimensions[height]=40" \
  -F "dimensions[depth]=2" \
  -F "materials[]=زيت على قماش" \
  -F "materials[]=أكريليك" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### باستخدام JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('title', 'لوحة المناظر الطبيعية');
formData.append('description', 'لوحة جميلة تصور المناظر الطبيعية الخلابة');
formData.append('price', '500');
formData.append('category', '60d0fe4f5311236168a109ca');
formData.append('tags[]', 'طبيعة');
formData.append('tags[]', 'رسم');
formData.append('tags[]', 'زيتي');
formData.append('status', 'available');
formData.append('isFramed', 'true');
formData.append('dimensions[width]', '60');
formData.append('dimensions[height]', '40');
formData.append('dimensions[depth]', '2');
formData.append('materials[]', 'زيت على قماش');
formData.append('materials[]', 'أكريليك');

// إضافة الصور
const imageFiles = document.getElementById('imageInput').files;
for (let i = 0; i < imageFiles.length; i++) {
  formData.append('images', imageFiles[i]);
}

fetch('https://arthub-api.vercel.app/api/artworks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### باستخدام Flutter

```dart
import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> createArtwork() async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('https://arthub-api.vercel.app/api/artworks'),
  );

  // إضافة headers
  request.headers['Authorization'] = 'Bearer YOUR_TOKEN';

  // إضافة البيانات النصية
  request.fields['title'] = 'لوحة المناظر الطبيعية';
  request.fields['description'] = 'لوحة جميلة تصور المناظر الطبيعية الخلابة';
  request.fields['price'] = '500';
  request.fields['category'] = '60d0fe4f5311236168a109ca';
  request.fields['tags[]'] = 'طبيعة';
  request.fields['tags[]'] = 'رسم';
  request.fields['tags[]'] = 'زيتي';
  request.fields['status'] = 'available';
  request.fields['isFramed'] = 'true';
  request.fields['dimensions[width]'] = '60';
  request.fields['dimensions[height]'] = '40';
  request.fields['dimensions[depth]'] = '2';
  request.fields['materials[]'] = 'زيت على قماش';
  request.fields['materials[]'] = 'أكريليك';

  // إضافة الصور
  for (File imageFile in selectedImages) {
    request.files.add(
      await http.MultipartFile.fromPath(
        'images',
        imageFile.path,
      ),
    );
  }

  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  print(responseData);
}
```

## الاستجابة المتوقعة

### نجاح (201)

```json
{
  "success": true,
  "message": "تم إنشاء العمل الفني بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "title": "لوحة المناظر الطبيعية",
    "description": "لوحة جميلة تصور المناظر الطبيعية الخلابة",
    "images": [
      "https://res.cloudinary.com/arthub/image/upload/v1234567890/artwork1.jpg",
      "https://res.cloudinary.com/arthub/image/upload/v1234567890/artwork2.jpg"
    ],
    "price": 500,
    "category": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "الرسم"
    },
    "artist": {
      "_id": "60d0fe4f5311236168a109cb",
      "displayName": "أحمد الفنان",
      "profileImage": "https://res.cloudinary.com/arthub/image/upload/v1234567890/profile.jpg"
    },
    "tags": ["طبيعة", "رسم", "زيتي"],
    "status": "available",
    "isFramed": true,
    "dimensions": {
      "width": 60,
      "height": 40,
      "depth": 2
    },
    "materials": ["زيت على قماش", "أكريليك"],
    "viewCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### أخطاء محتملة

#### 400 - بيانات غير صحيحة
```json
{
  "success": false,
  "message": "يجب إضافة صورة واحدة على الأقل للعمل الفني"
}
```

#### 413 - حجم الملفات كبير جداً
```json
{
  "success": false,
  "message": "حجم الملفات يتجاوز الحد المسموح"
}
```

#### 401 - غير مصرح
```json
{
  "success": false,
  "message": "غير مصرح بالوصول"
}
```

#### 403 - محظور (للفنانين فقط)
```json
{
  "success": false,
  "message": "فقط الفنانين يمكنهم إنشاء أعمال فنية"
}
```

## ملاحظات مهمة

1. **التحسين التلقائي**: سيتم تحسين الصور تلقائياً للحصول على أفضل جودة وأقل حجم
2. **التخزين**: يتم تخزين الصور على Cloudinary مع روابط دائمة
3. **الأمان**: يتم التحقق من نوع الملف وحجمه قبل المعالجة
4. **الأداء**: يتم معالجة الصور بشكل متوازي لتحسين الأداء 