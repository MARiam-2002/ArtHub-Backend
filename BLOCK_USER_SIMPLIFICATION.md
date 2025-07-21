# تبسيط blockUser Function

## 🎯 **التغيير المطلوب:**
تبسيط `blockUser` function لتأخذ فقط `id` من params بدون `action` و `reason` من body.

## ✅ **التغييرات المطبقة:**

### 1️⃣ **تبسيط Controller Function:**

```javascript
// قبل التغيير
export const blockUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action, reason } = req.body; // ❌ حذف هذا

  // Update user status
  if (action === 'block') {
    user.isActive = false;
    user.blockReason = reason;
    user.blockedAt = new Date();
  } else if (action === 'unblock') {
    user.isActive = true;
    user.blockReason = null;
    user.blockedAt = null;
  }
});

// بعد التغيير
export const blockUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ✅ فقط id

  // Toggle user status (block if active, unblock if inactive)
  const wasActive = user.isActive;
  user.isActive = !user.isActive;
  
  if (!user.isActive) {
    // Blocking user
    user.blockReason = 'تم الحظر من قبل الإدارة';
    user.blockedAt = new Date();
  } else {
    // Unblocking user
    user.blockReason = null;
    user.blockedAt = null;
  }
});
```

### 2️⃣ **تبسيط Validation Schema:**

```javascript
// قبل التغيير
export const blockUserSchema = {
  params: joi.object({
    id: joi.string().required()
  }),
  body: joi.object({
    action: joi.string().valid('block', 'unblock').required(),
    reason: joi.string().optional()
  })
};

// بعد التغيير
export const blockUserSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  })
  // لا حاجة لـ body validation
};
```

### 3️⃣ **تحديث Swagger Documentation:**

```javascript
// قبل التغيير
requestBody: {
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['block', 'unblock']
          },
          reason: {
            type: 'string'
          }
        }
      }
    }
  }
}

// بعد التغيير
// لا حاجة لـ requestBody لأننا لا نرسل أي بيانات
```

## 🚀 **الاستخدام الجديد:**

### **قبل التغيير:**
```javascript
// حظر مستخدم
PATCH /api/admin/users/123/block
{
  "action": "block",
  "reason": "انتهاك قواعد المنصة"
}

// إلغاء حظر مستخدم
PATCH /api/admin/users/123/block
{
  "action": "unblock"
}
```

### **بعد التغيير:**
```javascript
// حظر أو إلغاء حظر مستخدم (تبديل تلقائي)
PATCH /api/admin/users/123/block
// لا حاجة لـ body
```

## 📋 **الملفات المحدثة:**

1. **`src/modules/admin/admin.controller.js`** - تبسيط blockUser function
2. **`src/modules/admin/admin.validation.js`** - إزالة body validation
3. **`src/swagger/admin-swagger.js`** - تحديث Swagger docs
4. **`scripts/test-block-user-simple.js`** - script اختبار جديد

## ✅ **الفوائد:**

- **🎯 بساطة:** لا حاجة لإرسال `action` و `reason`
- **🔄 تلقائية:** التبديل بين الحظر وإلغاء الحظر تلقائياً
- **📱 سهولة:** استخدام أسهل في الفرونت إند
- **🔒 أمان:** سبب الحظر ثابت ومحدد

## 🧪 **اختبار التغيير:**

```bash
npm run test:block-user-simple
```

## 🎉 **النتيجة:**

تم تبسيط `blockUser` function بنجاح! الآن يمكن استخدامها بسهولة أكبر مع `id` فقط من params. 