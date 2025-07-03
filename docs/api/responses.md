# API Response Examples

This document provides examples of JSON responses for the most commonly used endpoints in the ArtHub API. These examples can be used as reference when implementing API integration in your Flutter application.

## Authentication Endpoints

### POST /api/auth/login

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم تسجيل الدخول بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "displayName": "مريم فوزي",
    "email": "user@example.com",
    "role": "artist",
    "profileImage": {
      "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (Invalid Credentials)

```json
{
  "success": false,
  "status": 401,
  "message": "بيانات الدخول غير صحيحة",
  "error": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "errorCode": "AUTH_INVALID_CREDENTIALS",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

### POST /api/auth/register

#### Success Response

```json
{
  "success": true,
  "status": 201,
  "message": "تم إنشاء الحساب بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "displayName": "مريم فوزي",
    "email": "user@example.com",
    "role": "user",
    "isVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (Email Already Exists)

```json
{
  "success": false,
  "status": 409,
  "message": "البريد الإلكتروني مسجل بالفعل",
  "error": "يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول",
  "errorCode": "AUTH_EMAIL_EXISTS",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

### POST /api/auth/refresh-token

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم تحديث رمز الوصول بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (Invalid Refresh Token)

```json
{
  "success": false,
  "status": 401,
  "message": "رمز التحديث غير صالح أو منتهي الصلاحية",
  "error": "يرجى تسجيل الدخول مرة أخرى",
  "errorCode": "AUTH_REFRESH_TOKEN_EXPIRED",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

## User Endpoints

### GET /api/user/:id

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب بيانات المستخدم بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "displayName": "مريم فوزي",
    "email": "user@example.com",
    "role": "artist",
    "bio": "فنانة تشكيلية متخصصة في الرسم الزيتي",
    "profileImage": {
      "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
    },
    "coverImages": [
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/cover1.jpg"
      },
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/cover2.jpg"
      }
    ],
    "location": "القاهرة، مصر",
    "socialLinks": {
      "instagram": "artist_instagram",
      "facebook": "artist_facebook",
      "twitter": "artist_twitter"
    },
    "followersCount": 120,
    "followingCount": 45,
    "artworksCount": 35,
    "isFollowing": false,
    "joinedAt": "2023-01-15T10:30:45.123Z"
  }
}
```

#### Error Response (User Not Found)

```json
{
  "success": false,
  "status": 404,
  "message": "المستخدم غير موجود",
  "error": "لم يتم العثور على مستخدم بهذا المعرف",
  "errorCode": "RESOURCE_NOT_FOUND",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

### PUT /api/user

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم تحديث بيانات المستخدم بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "displayName": "مريم أحمد فوزي",
    "bio": "فنانة تشكيلية متخصصة في الرسم الزيتي والألوان المائية",
    "location": "الإسكندرية، مصر",
    "socialLinks": {
      "instagram": "artist_instagram_updated",
      "facebook": "artist_facebook_updated",
      "twitter": "artist_twitter_updated"
    }
  }
}
```

## Artwork Endpoints

### GET /api/artworks

#### Success Response (Paginated)

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب الأعمال الفنية بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": [
    {
      "_id": "60d0fe4f5311236168a109cb",
      "title": "غروب على النيل",
      "description": "لوحة زيتية تصور غروب الشمس على نهر النيل",
      "price": 1500,
      "currency": "EGP",
      "category": {
        "_id": "60d0fe4f5311236168a109cc",
        "name": "لوحات زيتية"
      },
      "artist": {
        "_id": "60d0fe4f5311236168a109ca",
        "displayName": "مريم فوزي",
        "profileImage": {
          "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
        }
      },
      "images": [
        {
          "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork1.jpg",
          "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork1.jpg"
        }
      ],
      "likesCount": 45,
      "isLiked": true,
      "isSaved": false,
      "createdAt": "2023-03-15T10:30:45.123Z"
    },
    // More artworks...
  ],
  "metadata": {
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### GET /api/artworks/:id

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب العمل الفني بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109cb",
    "title": "غروب على النيل",
    "description": "لوحة زيتية تصور غروب الشمس على نهر النيل. استخدمت فيها ألوان زيتية عالية الجودة على قماش كتان طبيعي.",
    "price": 1500,
    "currency": "EGP",
    "dimensions": {
      "width": 60,
      "height": 40,
      "unit": "cm"
    },
    "materials": ["زيت", "قماش كتان"],
    "category": {
      "_id": "60d0fe4f5311236168a109cc",
      "name": "لوحات زيتية"
    },
    "artist": {
      "_id": "60d0fe4f5311236168a109ca",
      "displayName": "مريم فوزي",
      "profileImage": {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
      },
      "bio": "فنانة تشكيلية متخصصة في الرسم الزيتي",
      "followersCount": 120
    },
    "images": [
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork1.jpg",
        "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork1.jpg",
        "small": "https://res.cloudinary.com/demo/image/upload/t_small/v1612345678/artwork1.jpg",
        "medium": "https://res.cloudinary.com/demo/image/upload/t_medium/v1612345678/artwork1.jpg",
        "large": "https://res.cloudinary.com/demo/image/upload/t_large/v1612345678/artwork1.jpg"
      },
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork1_detail.jpg",
        "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork1_detail.jpg",
        "small": "https://res.cloudinary.com/demo/image/upload/t_small/v1612345678/artwork1_detail.jpg",
        "medium": "https://res.cloudinary.com/demo/image/upload/t_medium/v1612345678/artwork1_detail.jpg",
        "large": "https://res.cloudinary.com/demo/image/upload/t_large/v1612345678/artwork1_detail.jpg"
      }
    ],
    "tags": ["طبيعة", "نيل", "غروب", "مصر"],
    "likesCount": 45,
    "isLiked": true,
    "isSaved": false,
    "reviewsCount": 12,
    "averageRating": 4.7,
    "availability": "available",
    "createdAt": "2023-03-15T10:30:45.123Z",
    "updatedAt": "2023-04-10T08:22:15.456Z"
  }
}
```

## Chat Endpoints

### GET /api/chat

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب المحادثات بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": [
    {
      "_id": "60d0fe4f5311236168a109cd",
      "participants": [
        {
          "_id": "60d0fe4f5311236168a109ca",
          "displayName": "مريم فوزي",
          "profileImage": {
            "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
          }
        },
        {
          "_id": "60d0fe4f5311236168a109ce",
          "displayName": "أحمد محمد",
          "profileImage": {
            "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile2.jpg"
          }
        }
      ],
      "lastMessage": {
        "_id": "60d0fe4f5311236168a109cf",
        "content": "شكراً لك، سأرسل لك التفاصيل قريباً",
        "sender": "60d0fe4f5311236168a109ce",
        "createdAt": "2023-05-14T15:45:30.123Z",
        "isRead": true
      },
      "unreadCount": 0,
      "updatedAt": "2023-05-14T15:45:30.123Z"
    },
    // More chats...
  ],
  "metadata": {
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### GET /api/chat/:id/messages

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب الرسائل بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": [
    {
      "_id": "60d0fe4f5311236168a109d0",
      "chatId": "60d0fe4f5311236168a109cd",
      "content": "مرحباً، أنا مهتم بشراء لوحة غروب على النيل",
      "sender": {
        "_id": "60d0fe4f5311236168a109ce",
        "displayName": "أحمد محمد"
      },
      "isRead": true,
      "createdAt": "2023-05-14T15:30:10.123Z"
    },
    {
      "_id": "60d0fe4f5311236168a109d1",
      "chatId": "60d0fe4f5311236168a109cd",
      "content": "أهلاً بك، سعيدة باهتمامك. هل لديك أي استفسارات عن اللوحة؟",
      "sender": {
        "_id": "60d0fe4f5311236168a109ca",
        "displayName": "مريم فوزي"
      },
      "isRead": true,
      "createdAt": "2023-05-14T15:35:22.123Z"
    },
    {
      "_id": "60d0fe4f5311236168a109cf",
      "chatId": "60d0fe4f5311236168a109cd",
      "content": "شكراً لك، سأرسل لك التفاصيل قريباً",
      "sender": {
        "_id": "60d0fe4f5311236168a109ce",
        "displayName": "أحمد محمد"
      },
      "isRead": true,
      "createdAt": "2023-05-14T15:45:30.123Z"
    }
  ],
  "metadata": {
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 3,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Notification Endpoints

### GET /api/notifications

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب الإشعارات بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": [
    {
      "_id": "60d0fe4f5311236168a109d2",
      "title": "رسالة جديدة",
      "message": "لديك رسالة جديدة من أحمد محمد",
      "type": "message",
      "isRead": false,
      "ref": "60d0fe4f5311236168a109cf",
      "refModel": "Message",
      "data": {
        "chatId": "60d0fe4f5311236168a109cd",
        "senderId": "60d0fe4f5311236168a109ce",
        "senderName": "أحمد محمد"
      },
      "createdAt": "2023-05-14T15:45:30.123Z"
    },
    {
      "_id": "60d0fe4f5311236168a109d3",
      "title": "إعجاب جديد",
      "message": "أعجب سارة علي بعملك الفني 'غروب على النيل'",
      "type": "other",
      "isRead": true,
      "ref": "60d0fe4f5311236168a109cb",
      "refModel": "Artwork",
      "data": {
        "artworkId": "60d0fe4f5311236168a109cb",
        "artworkTitle": "غروب على النيل",
        "userId": "60d0fe4f5311236168a109d4",
        "userName": "سارة علي"
      },
      "createdAt": "2023-05-13T09:20:15.123Z"
    }
  ],
  "metadata": {
    "pagination": {
      "currentPage": 1,
      "itemsPerPage": 20,
      "totalItems": 2,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Special Request Endpoints

### GET /api/special-requests/:id

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب الطلب الخاص بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109d5",
    "title": "لوحة شخصية عائلية",
    "description": "أرغب في لوحة شخصية لعائلتي المكونة من 4 أفراد، بأسلوب واقعي",
    "budget": 2500,
    "currency": "EGP",
    "deadline": "2023-07-15T00:00:00.000Z",
    "status": "pending",
    "client": {
      "_id": "60d0fe4f5311236168a109ce",
      "displayName": "أحمد محمد",
      "profileImage": {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile2.jpg"
      }
    },
    "artist": {
      "_id": "60d0fe4f5311236168a109ca",
      "displayName": "مريم فوزي",
      "profileImage": {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
      }
    },
    "referenceImages": [
      {
        "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/reference1.jpg",
        "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/reference1.jpg"
      }
    ],
    "dimensions": {
      "width": 50,
      "height": 70,
      "unit": "cm"
    },
    "createdAt": "2023-05-10T14:25:10.123Z",
    "updatedAt": "2023-05-10T14:25:10.123Z"
  }
}
```

## Transaction Endpoints

### GET /api/transactions/:id

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب المعاملة بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "_id": "60d0fe4f5311236168a109d6",
    "artwork": {
      "_id": "60d0fe4f5311236168a109cb",
      "title": "غروب على النيل",
      "images": [
        {
          "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork1.jpg"
        }
      ]
    },
    "seller": {
      "_id": "60d0fe4f5311236168a109ca",
      "displayName": "مريم فوزي"
    },
    "buyer": {
      "_id": "60d0fe4f5311236168a109ce",
      "displayName": "أحمد محمد"
    },
    "amount": 1500,
    "currency": "EGP",
    "status": "completed",
    "paymentMethod": "card",
    "paymentDetails": {
      "cardLast4": "4242",
      "cardBrand": "visa"
    },
    "shippingAddress": {
      "name": "أحمد محمد",
      "street": "123 شارع النصر",
      "city": "القاهرة",
      "state": "القاهرة",
      "country": "مصر",
      "postalCode": "12345",
      "phone": "+201234567890"
    },
    "shippingStatus": "shipped",
    "trackingNumber": "TRK12345678",
    "invoiceUrl": "https://example.com/invoices/INV-12345",
    "createdAt": "2023-05-01T09:15:30.123Z",
    "updatedAt": "2023-05-03T14:20:45.456Z"
  }
}
```

## Category Endpoints

### GET /api/categories

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب التصنيفات بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": [
    {
      "_id": "60d0fe4f5311236168a109cc",
      "name": "لوحات زيتية",
      "description": "لوحات فنية منفذة بألوان الزيت",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1612345678/categories/oil.jpg"
    },
    {
      "_id": "60d0fe4f5311236168a109d7",
      "name": "رسم بالألوان المائية",
      "description": "لوحات فنية منفذة بالألوان المائية",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1612345678/categories/watercolor.jpg"
    },
    {
      "_id": "60d0fe4f5311236168a109d8",
      "name": "نحت",
      "description": "أعمال نحتية بمختلف الخامات",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1612345678/categories/sculpture.jpg"
    }
  ]
}
```

## Home Feed Endpoints

### GET /api/home/feed

#### Success Response

```json
{
  "success": true,
  "status": 200,
  "message": "تم جلب محتوى الصفحة الرئيسية بنجاح",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456",
  "data": {
    "featured": [
      {
        "_id": "60d0fe4f5311236168a109cb",
        "title": "غروب على النيل",
        "artist": {
          "_id": "60d0fe4f5311236168a109ca",
          "displayName": "مريم فوزي"
        },
        "images": [
          {
            "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork1.jpg",
            "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork1.jpg",
            "medium": "https://res.cloudinary.com/demo/image/upload/t_medium/v1612345678/artwork1.jpg"
          }
        ],
        "price": 1500,
        "currency": "EGP",
        "likesCount": 45
      }
    ],
    "topArtists": [
      {
        "_id": "60d0fe4f5311236168a109ca",
        "displayName": "مريم فوزي",
        "profileImage": {
          "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
        },
        "followersCount": 120,
        "artworksCount": 35
      }
    ],
    "recentArtworks": [
      {
        "_id": "60d0fe4f5311236168a109d9",
        "title": "حياة صامتة مع فاكهة",
        "artist": {
          "_id": "60d0fe4f5311236168a109da",
          "displayName": "خالد إبراهيم"
        },
        "images": [
          {
            "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork2.jpg",
            "thumbnail": "https://res.cloudinary.com/demo/image/upload/t_thumbnail/v1612345678/artwork2.jpg",
            "medium": "https://res.cloudinary.com/demo/image/upload/t_medium/v1612345678/artwork2.jpg"
          }
        ],
        "price": 1200,
        "currency": "EGP",
        "likesCount": 23
      }
    ],
    "popularCategories": [
      {
        "_id": "60d0fe4f5311236168a109cc",
        "name": "لوحات زيتية",
        "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1612345678/categories/oil.jpg",
        "artworksCount": 120
      }
    ]
  }
}
``` 