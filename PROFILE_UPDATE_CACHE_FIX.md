# إصلاح مشكلة تحديث الصورة والاسم في الصفحة الرئيسية

## المشكلة
كانت هناك مشكلة في أن الصورة والاسم في الصفحة الرئيسية (Home Page) لا يتم تحديثهما بعد تحديث الملف الشخصي (Update Profile).

## السبب الجذري
المشكلة كانت في أن بيانات المستخدم الحالي (`currentUser`) في الصفحة الرئيسية لم تكن محفوظة في الـ cache، بل كانت تُجلب مباشرة من قاعدة البيانات في كل مرة. هذا يعني أن البيانات يجب أن تكون محدثة دائماً، لكن كان هناك مشكلة في آلية الـ cache invalidation.

## الحل المطبق

### 1. إضافة Cache لبيانات المستخدم الحالي
تم تعديل `src/modules/home/home.controller.js` لإضافة cache لبيانات المستخدم الحالي:

```javascript
// Get current user data if authenticated (with caching)
let currentUser = null;
if (userId) {
  const userCacheKey = `user:current:${userId}`;
  currentUser = await cacheUserProfile(userCacheKey, async () => {
    const user = await userModel.findById(userId)
      .select('displayName profileImage photoURL email role')
      .lean();
    
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      displayName: user.displayName,
      profileImage: getImageUrl(user.profileImage, user.photoURL),
      email: user.email,
      role: user.role
    };
  });
}
```

### 2. تحديث Cache Invalidation
تم تحديث `src/utils/cacheHelpers.js` لتشمل الـ cache key الجديد:

```javascript
export const invalidateUserCache = async (userId) => {
  const patterns = [
    `user:profile:${userId}`,
    `user:current:${userId}`, // ← إضافة جديدة
    `user:wishlist:${userId}:*`,
    // ... باقي الأنماط
  ];
  // ...
};
```

### 3. تحسين Home Cache Invalidation
تم إضافة `user:current:*` إلى أنماط invalidate الـ home cache:

```javascript
export const invalidateHomeCache = async () => {
  const patterns = [
    'home:data:user:*',
    'home:data:guest',
    'user:current:*', // ← إضافة جديدة
    // ... باقي الأنماط
  ];
  // ...
};
```

## كيفية عمل الحل

1. **عند تحديث الملف الشخصي**: يتم استدعاء `invalidateUserCache(userId)` و `invalidateHomeCache()`
2. **عند جلب بيانات الصفحة الرئيسية**: يتم فحص الـ cache أولاً للـ `user:current:${userId}`
3. **إذا لم تكن البيانات في الـ cache**: يتم جلبها من قاعدة البيانات وحفظها في الـ cache
4. **عند التحديث التالي**: يتم استخدام البيانات المحدثة من الـ cache

## اختبار الحل

تم إنشاء script للاختبار في `scripts/test-profile-update-cache.js`:

```bash
node scripts/test-profile-update-cache.js
```

الـ script يقوم بـ:
1. تسجيل الدخول
2. جلب البيانات الأولية للصفحة الرئيسية
3. تحديث الملف الشخصي
4. جلب البيانات المحدثة للصفحة الرئيسية
5. التحقق من أن التحديث تم بشكل صحيح

## الملفات المعدلة

1. `src/modules/home/home.controller.js` - إضافة cache لبيانات المستخدم الحالي
2. `src/utils/cacheHelpers.js` - تحديث cache invalidation patterns
3. `scripts/test-profile-update-cache.js` - script للاختبار

## النتيجة

✅ **تم حل المشكلة**: الآن عند تحديث الصورة والاسم في الملف الشخصي، يتم تحديثهما فوراً في الصفحة الرئيسية.

## ملاحظات إضافية

- الحل يحافظ على الأداء من خلال استخدام الـ cache
- يتم invalidate الـ cache بشكل صحيح عند التحديث
- الـ cache له TTL مناسب لضمان تحديث البيانات
- الحل متوافق مع النظام الحالي ولا يؤثر على الوظائف الأخرى
