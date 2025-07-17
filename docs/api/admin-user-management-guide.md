# دليل إدارة المستخدمين - لوحة التحكم الإدارية

## نظرة عامة

هذا الدليل يوضح كيفية استخدام نقاط النهاية (endpoints) لإدارة المستخدمين في لوحة التحكم الإدارية. النظام يدعم إدارة كل من العملاء (users) والفنانين (artists).

## نقاط النهاية المتاحة

###1 جلب جميع المستخدمين
```
GET /api/v1/admin/users
```

**الوصف:** جلب قائمة بجميع المستخدمين (عملاء وفنانين) مع إحصائيات أساسية.

**الاستجابة:**
```json
{
  success": true,
  message": "تم جلب قائمة المستخدمين بنجاح,data":[object Object]users":      [object Object]      _iduser_id",
       displayName":عمر خالد محمد",
        email": "omar0.2004mail.com",
       phoneNumber":+20114078450,
      role:user,
       status":active",
        isActive: true,
        isVerified: true,
       profileImage": "image_url",
        lastActive: 20251030,
        createdAt: 202310000Z",
     job:طالب
      location": "القاهرة، مصر",
        bio": مستخدم نشط"
      }
    ],
  statistics": {
     totalUsers": 150      activeUsers": 120      bannedUsers":5,
    clients: 10,
     artists: 50
    }
  }
}
```

###2 جلب تفاصيل مستخدم محدد
```
GET /api/v1in/users/:id
```

**الوصف:** جلب تفاصيل شاملة لمستخدم محدد مع إحصائياته.

**الاستجابة:**
```json
{
  success": true,
  message": "تم جلب تفاصيل المستخدم بنجاح,  data": [object Object]   _id": "user_id",
   displayName":عمر خالد محمد",
    email": "omar0.24@gmail.com",
   phoneNumber":+20114078450
  role": "user,status:active,  isActive": true,
    isVerified": true,
   profileImage": image_url",
   coverImages": ["image1, "image2    bio":مستخدم نشط",
    job": "طالب,
  location": "القاهرة، مصر,
    lastActive: 2025118T10:30:0Z",
    createdAt: 20231015T00:00:0Z",
    updatedAt: 2025118T10:30,
  statistics": {
     totalOrders": 12
      totalSpent": 2450    totalReviews":8    averageRating": 4.8
    }
  }
}
```

### 3. حظر/إلغاء حظر مستخدم
```
PATCH /api/v1in/users/:id/block
```

**الوصف:** حظر أو إلغاء حظر حساب مستخدم.

**الطلب:**
```json
{
action": block, reason": انتهاك قواعد المنصة"
}
```

**الاستجابة:**
```json
{
  success": true,
  message": "تم حظر المستخدم بنجاح,  data": [object Object]   _id": "user_id,
   status:banned,isActive": false,
    blockReason": انتهاك قواعد المنصة",
    blockedAt: 2025-118T10:300Z
  }
}
```

###4رسال رسالة لمستخدم
```
POST /api/v1/admin/users/:id/send-message
```

**الوصف:** إرسال رسالة لمستخدم عبر البريد الإلكتروني أو الشات أو كلاهما.

**الطلب:**
```json
[object Object]subject: سالة من إدارة المنصة",
  message:مرحباً، هذه رسالة من إدارة منصة ArtHub",
 deliveryMethod": "both",
  attachments": 
```

**خيارات التوصيل:**
- `email`: إرسال عبر البريد الإلكتروني فقط
- `chat`: إرسال عبر الشات فقط
- `both`: إرسال عبر كلا الطريقتين

**الاستجابة:**
```json
{
  success": true,
  message":تم إرسال الرسالة بنجاح,data:[object Object]   userId": "user_id",
   deliveryMethod": both",
   emailSent: true,
    chatSent: true,
    sentAt: 2025-118T10:300Z
  }
}
```

### 5جلب طلبات المستخدم
```
GET /api/v1n/users/:id/orders
```

**الوصف:** جلب جميع طلبات مستخدم محدد.

**الاستجابة:**
```json
{
  success": true,
  message": "تم جلب طلبات المستخدم بنجاح,data:[object Object]orders":      [object Object]   _id": "order_id",
        title":لوحة زيتية مخصصة",
        description":لوحة زيتية جميلة",
    price": 850
 status": "completed,
  artist": [object Object]         _id": "artist_id",
          displayName": "احمد محمد",
         profileImage: ist_image"
        },
        createdAt: 2025100,
        updatedAt: 2025-18000Z"
      }
    ]
  }
}
```

### 6. جلب تقييمات المستخدم
```
GET /api/v1/admin/users/:id/reviews
```

**الوصف:** جلب جميع تقييمات مستخدم محدد.

**الاستجابة:**
```json
{
  success": true,
  message:  جلب تقييمات المستخدم بنجاح,
 data": {
    reviews":      [object Object]   _id": "review_id,
   rating": 5,
       comment": عمل رائع جدا ويستحق التقدير",
   artwork": [object Object]          _id": "artwork_id",
          title":لوحة زيتية مخصصة",
         image": "artwork_image"
        },
  artist": [object Object]         _id": "artist_id",
          displayName": "احمد محمد",
         profileImage: ist_image"
        },
        createdAt: 2025-18000Z"
      }
    ]
  }
}
```

### 7. جلب سجل نشاط المستخدم
```
GET /api/v1users/:id/activity
```

**الوصف:** جلب سجل نشاط مستخدم محدد.

**الاستجابة:**
```json
{
  success": true,
  message": "تم جلب سجل نشاط المستخدم بنجاح,data[object Object]
  activities":      [object Object]_id: ivity_id,
       type: login      description": "تم تسجيل الدخول",
        timestamp: 20251030
    metadata:[object Object]
          ip: 680.1       location":القاهرة"
        }
      },
      [object Object]_id":activity_id_2,
       type: order      description": تم إنشاء طلب جديد",
        timestamp: 20251530
    metadata": [object Object]        orderId":1234
      amount": 250        }
      }
    ]
  }
}
```

### 8. تصدير بيانات المستخدمين
```
GET /api/v1/admin/users/export
```

**الوصف:** تصدير بيانات المستخدمين بصيغة CSV أو Excel.

**المعاملات:**
- `format`: csv أو excel
- `role`: user أو artist أو all
- `status`: active أو inactive أو banned أو all
- `dateFrom`: تاريخ البداية (اختياري)
- `dateTo`: تاريخ النهاية (اختياري)

**مثال:**
```
GET /api/v1/admin/users/export?format=csv&role=user&status=active
```

## كيفية الاستخدام

###1 إعداد التوثيق
```javascript
// الحصول على token من تسجيل دخول الأدمن
const adminToken = your_admin_token_here";

// إعداد headers
const headers = [object Object]  Authorization: `Bearer ${adminToken}`,
 Content-Type':application/json};
```

### 2جلب قائمة المستخدمين
```javascript
const response = await fetch('/api/v1/admin/users', {
  method:GET  headers: headers
});

const data = await response.json();
console.log(data.data.users); // قائمة المستخدمين
console.log(data.data.statistics); // الإحصائيات
```

###3تخدم
```javascript
const response = await fetch(`/api/v1/admin/users/${userId}/block`, [object Object] method: PATCH',
  headers: headers,
  body: JSON.stringify({
    action: 'block,    reason: انتهاك قواعد المنصة'
  })
});
```

### 4سالة
```javascript
const response = await fetch(`/api/v1/admin/users/${userId}/send-message`,[object Object]  method: POST  headers: headers,
  body: JSON.stringify([object Object]   subject: 'رسالة من إدارة المنصة',
    message: مرحباً، هذه رسالة من إدارة منصة ArtHub',
    deliveryMethod: 'both,
    attachments:]
  })
});
```

## ملاحظات مهمة
1*الصلاحيات:** جميع النقاط تتطلب صلاحيات admin أو superadmin
2. **التوثيق:** يجب إرسال token الأدمن في header Authorization
3. **الفلترة:** الفرونت إند يقوم بالفلترة والبحث محلياً
4 **التصدير:** يدعم تصدير البيانات بصيغ مختلفة
5 **الرسائل:** يدعم إرسال الرسائل عبر البريد الإلكتروني والشات

## أمثلة الاستخدام في الفرونت إند

### React/Vue.js مثال
```javascript
// جلب المستخدمين
const getUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    setUsers(response.data.data.users);
    setStatistics(response.data.data.statistics);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// حظر مستخدم
const blockUser = async (userId, reason) => {
  try[object Object]   await api.patch(`/admin/users/${userId}/block`,[object Object]    action: 'block',
      reason: reason
    });
    // تحديث قائمة المستخدمين
    getUsers();
  } catch (error) {
    console.error('Error blocking user:', error);
  }
};

// إرسال رسالة
const sendMessage = async (userId, messageData) => {
  try {
    await api.post(`/admin/users/${userId}/send-message`, messageData);
    // إظهار رسالة نجاح
  } catch (error) {
    console.error('Error sending message:, error);
  }
};
```

## استكشاف الأخطاء

### أخطاء شائعة:1**41uthorized:** token غير صحيح أو منتهي الصلاحية
2**43Forbidden:** لا تملك صلاحيات كافية
3**404 Not Found:** المستخدم غير موجود
4. **400 Request:** بيانات غير صحيحة

### حلول:
1. تأكد من صحة token الأدمن
2ق من صلاحيات المستخدم
3. تأكد من صحة معرف المستخدم
4. تحقق من صحة البيانات المرسلة 