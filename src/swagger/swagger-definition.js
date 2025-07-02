/**
 * تعريفات سواغر للتوثيق
 * مع أمثلة مفصلة للاستجابات وحالات الخطأ
 */
export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ArtHub API',
    description: `
# واجهة برمجة التطبيقات للفنانين والمبدعين

توثيق شامل لواجهة برمجة التطبيقات الخاصة بمنصة ArtHub. تدعم هذه المنصة الفنانين والمبدعين في عرض أعمالهم الفنية والتواصل مع العملاء.

## الميزات الرئيسية

- واجهة RESTful كاملة للتطبيقات
- مصادقة مزدوجة (Firebase والخادم)
- دعم متعدد اللغات (العربية والإنجليزية)
- رفع ومعالجة الصور والأعمال الفنية
- نظام مراسلة متكامل
- نظام إشعارات متقدم
- نظام معاملات مالية وطلبات خاصة
- دعم المتابعة والتقييمات
- نظام تقارير وإحصائيات
- تحسين وضغط الصور تلقائياً

## استخدام API

يمكن استخدام واجهة برمجة التطبيقات هذه من تطبيقات الهاتف المحمول (Flutter) أو أي تطبيق آخر.

## دعم تعدد اللغات

توفر API دعماً كاملاً للغتين العربية والإنجليزية. يمكن تحديد اللغة المفضلة في طلبات API باستخدام المعلمة \`language\` (ar أو en).
كما يمكن للمستخدمين تعيين اللغة المفضلة في ملفهم الشخصي.

## تنظيم API حسب شاشات التطبيق

لتسهيل تطوير تطبيق Flutter، تم تنظيم واجهات API وفقًا لشاشات التطبيق. انظر إلى الحقل "x-screen" في كل واجهة API لمعرفة الشاشة المرتبطة بها.

للحصول على مستند يربط بين الشاشات وواجهات API، راجع [دليل ربط واجهات API بشاشات التطبيق](/docs/SCREEN_API_MAPPING.md).
`,
    version: '1.0.0',
    contact: {
      name: 'فريق دعم ArtHub',
      email: 'support@arthub.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'خادم API الرئيسي'
    },
    {
      url: 'https://arthub-api.vercel.app/api',
      description: 'خادم الإنتاج'
    },
    {
      url: 'http://localhost:5000/api',
      description: 'خادم التطوير المحلي'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'أدخل رمز JWT الذي تم الحصول عليه من تسجيل الدخول أو التسجيل'
      },
      FirebaseAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'أدخل رمز Firebase JWT الذي تم الحصول عليه من تسجيل الدخول بحساب Google/Facebook'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'غير مصرح - المصادقة مطلوبة',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'غير مصرح بالوصول'
                },
                error: {
                  type: 'string',
                  example: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
                },
                status: {
                  type: 'integer',
                  example: 401
                }
              }
            }
          }
        }
      },
      BadRequestError: {
        description: 'طلب غير صالح - مشكلة في البيانات المرسلة',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'بيانات غير صالحة'
                },
                error: {
                  type: 'string',
                  example: 'حقل البريد الإلكتروني مطلوب'
                },
                status: {
                  type: 'integer',
                  example: 400
                },
                validationErrors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'email'
                      },
                      message: {
                        type: 'string',
                        example: 'يجب إدخال بريد إلكتروني صالح'
                      }
                    }
                  },
                  example: [
                    { field: 'email', message: 'يجب إدخال بريد إلكتروني صالح' },
                    { field: 'password', message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
                  ]
                }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'غير موجود - المورد المطلوب غير متاح',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'المورد غير موجود'
                },
                error: {
                  type: 'string',
                  example: 'لم يتم العثور على العنصر بالمعرف المحدد'
                },
                status: {
                  type: 'integer',
                  example: 404
                }
              }
            }
          }
        }
      },
      ServerError: {
        description: 'خطأ في الخادم - فشل في معالجة الطلب',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'خطأ داخلي في الخادم'
                },
                error: {
                  type: 'string',
                  example: 'فشل في الاتصال بقاعدة البيانات'
                },
                status: {
                  type: 'integer',
                  example: 500
                }
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'محظور - ليس لديك صلاحية الوصول إلى هذا المورد',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  example: false
                },
                message: {
                  type: 'string',
                  example: 'غير مسموح بالوصول'
                },
                error: {
                  type: 'string',
                  example: 'لا تملك الصلاحية للوصول إلى هذا المورد'
                },
                status: {
                  type: 'integer',
                  example: 403
                }
              }
            }
          }
        }
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'تمت العملية بنجاح'
          },
          data: {
            type: 'object',
            example: {}
          },
          status: {
            type: 'integer',
            example: 200
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:30:45.123Z'
          },
          requestId: {
            type: 'string',
            example: 'req-123abc456'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'حدث خطأ أثناء معالجة الطلب'
          },
          error: {
            type: 'string',
            example: 'وصف تفصيلي للخطأ'
          },
          status: {
            type: 'integer',
            example: 400
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:30:45.123Z'
          },
          requestId: {
            type: 'string',
            example: 'req-123abc456'
          }
        }
      },
      LanguagePreference: {
        type: 'object',
        properties: {
          language: {
            type: 'string',
            enum: ['ar', 'en'],
            example: 'ar',
            description: 'رمز اللغة المفضلة (ar للعربية، en للإنجليزية)'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'حالة الاستجابة'
          },
          message: {
            type: 'string',
            description: 'رسالة الاستجابة'
          },
          data: {
            type: 'object',
            description: 'بيانات الاستجابة'
          },
          status: {
            type: 'integer',
            description: 'رمز حالة HTTP'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'توقيت الاستجابة'
          }
        }
      },
      Error400: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'بيانات غير صالحة'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'يجب أن يكون البريد الإلكتروني صالحًا'
                }
              }
            }
          },
          status: {
            type: 'integer',
            example: 400
          }
        }
      },
      Error401: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'غير مصرح لك بالوصول'
          },
          status: {
            type: 'integer',
            example: 401
          }
        }
      },
      Error404: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'لم يتم العثور على المورد المطلوب'
          },
          status: {
            type: 'integer',
            example: 404
          }
        }
      },
      Error500: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'حدث خطأ في الخادم'
          },
          status: {
            type: 'integer',
            example: 500
          }
        }
      },
      UserLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!'
          }
        }
      },
      UserRegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'confirmPassword', 'displayName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!'
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            example: 'Password123!'
          },
          displayName: {
            type: 'string',
            example: 'أحمد محمد'
          },
          profileImage: {
            type: 'string',
            format: 'binary'
          },
          phoneNumber: {
            type: 'string',
            example: '+966512345678'
          }
        }
      },
      ForgetPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          }
        }
      },
      VerificationCodeRequest: {
        type: 'object',
        required: ['email', 'forgetCode'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          forgetCode: {
            type: 'string',
            pattern: '^\\d{4}$',
            example: '1234'
          }
        }
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'password', 'confirmPassword'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'NewPassword123!'
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            example: 'NewPassword123!'
          }
        }
      },
      FCMTokenRequest: {
        type: 'object',
        required: ['fcmToken'],
        properties: {
          fcmToken: {
            type: 'string',
            example: 'fMEGG8-TQVSEJHBFrk-BZ3:APA91bHZKmJLnmRJHBFrk...'
          }
        }
      },
      AuthSuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'تم تسجيل الدخول بنجاح'
          },
          data: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                example: '60d0fe4f5311236168a109ca'
              },
              displayName: {
                type: 'string',
                example: 'أحمد محمد'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com'
              },
              role: {
                type: 'string',
                enum: ['user', 'artist'],
                example: 'user'
              },
              profileImage: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg'
                  }
                }
              },
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        }
      },
      TokenModel: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109cb'
          },
          user: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          userAgent: {
            type: 'string',
            example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
          },
          isValid: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-06-15T10:30:45.123Z'
          }
        }
      },
      UserResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c85'
          },
          email: {
            type: 'string',
            example: 'user@example.com'
          },
          displayName: {
            type: 'string',
            example: 'أحمد محمد'
          },
          profileImage: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg'
              }
            }
          },
          role: {
            type: 'string',
            enum: ['user', 'artist', 'admin'],
            example: 'artist'
          },
          job: {
            type: 'string',
            example: 'فنان'
          },
          isVerified: {
            type: 'boolean',
            example: true
          },
          preferredLanguage: {
            type: 'string',
            enum: ['ar', 'en'],
            example: 'ar'
          },
          bio: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'فنان تشكيلي متخصص في الرسم بالألوان المائية'
              },
              en: {
                type: 'string',
                example: 'Visual artist specializing in watercolor painting'
              }
            }
          }
        }
      },
      NotificationResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c85'
          },
          title: {
            type: 'string',
            example: 'لديك رسالة جديدة'
          },
          message: {
            type: 'string',
            example: 'أرسل لك محمد رسالة جديدة'
          },
          type: {
            type: 'string',
            enum: ['message', 'follow', 'artwork', 'comment', 'system'],
            example: 'message'
          },
          isRead: {
            type: 'boolean',
            example: false
          },
          data: {
            type: 'object',
            properties: {
              screen: {
                type: 'string',
                example: 'ChatScreen'
              },
              id: {
                type: 'string',
                example: '60d21b4667d0d8992e610c85'
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      NotificationsListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'تم جلب الإشعارات بنجاح'
          },
          data: {
            type: 'object',
            properties: {
              notifications: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/NotificationResponse'
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  currentPage: {
                    type: 'integer',
                    example: 1
                  },
                  totalPages: {
                    type: 'integer',
                    example: 5
                  },
                  totalItems: {
                    type: 'integer',
                    example: 25
                  },
                  unreadCount: {
                    type: 'integer',
                    example: 3
                  }
                }
              }
            }
          }
        }
      },
      ImageUploadResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'تم رفع الصورة بنجاح'
          },
          data: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                example: '60d21b4667d0d8992e610c85'
              },
              url: {
                type: 'string',
                example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/artwork.jpg'
              },
              publicId: {
                type: 'string',
                example: 'arthub/images/abcdef123456'
              },
              title: {
                type: 'object',
                properties: {
                  ar: {
                    type: 'string',
                    example: 'لوحة زهور زرقاء'
                  },
                  en: {
                    type: 'string',
                    example: 'Blue Flowers Painting'
                  }
                }
              },
              optimizationLevel: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                example: 'medium'
              },
              variants: {
                type: 'object',
                properties: {
                  thumbnail: {
                    type: 'string',
                    example:
                      'https://res.cloudinary.com/demo/image/upload/c_thumb,w_200,h_200/v1612345678/artwork.jpg'
                  },
                  medium: {
                    type: 'string',
                    example:
                      'https://res.cloudinary.com/demo/image/upload/c_scale,w_800/v1612345678/artwork.jpg'
                  }
                }
              }
            }
          }
        }
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token received during login',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      RefreshTokenResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'تم تحديث رمز الوصول بنجاح'
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          }
        }
      },
      // User Management Schemas
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          displayName: {
            type: 'string',
            example: 'أحمد محمد الفنان'
          },
          bio: {
            type: 'string',
            example: 'فنان تشكيلي متخصص في الرسم الزيتي'
          },
          job: {
            type: 'string',
            example: 'فنان تشكيلي'
          },
          location: {
            type: 'string',
            example: 'الرياض، السعودية'
          },
          website: {
            type: 'string',
            format: 'uri',
            example: 'https://artist-portfolio.com'
          },
          socialMedia: {
            type: 'object',
            properties: {
              instagram: {
                type: 'string',
                example: '@artist_instagram'
              },
              twitter: {
                type: 'string',
                example: '@artist_twitter'
              },
              facebook: {
                type: 'string',
                example: 'artist.facebook'
              }
            }
          },
          profileImage: {
            type: 'string',
            format: 'binary'
          }
        }
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            example: 'CurrentPassword123!'
          },
          newPassword: {
            type: 'string',
            format: 'password',
            example: 'NewPassword123!'
          },
          confirmPassword: {
            type: 'string',
            format: 'password',
            example: 'NewPassword123!'
          }
        }
      },
      WishlistItem: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          artwork: {
            $ref: '#/components/schemas/ArtworkResponse'
          },
          addedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      // Category Schemas
      Category: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          name: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات زيتية'
              },
              en: {
                type: 'string',
                example: 'Oil Paintings'
              }
            }
          },
          description: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات مرسومة بالألوان الزيتية'
              },
              en: {
                type: 'string',
                example: 'Paintings created with oil colors'
              }
            }
          },
          image: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/category.jpg'
              },
              publicId: {
                type: 'string',
                example: 'category_123456'
              }
            }
          },
          artworkCount: {
            type: 'integer',
            example: 25
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'object',
            required: ['ar', 'en'],
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات زيتية'
              },
              en: {
                type: 'string',
                example: 'Oil Paintings'
              }
            }
          },
          description: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات مرسومة بالألوان الزيتية'
              },
              en: {
                type: 'string',
                example: 'Paintings created with oil colors'
              }
            }
          },
          image: {
            type: 'string',
            format: 'binary'
          }
        }
      },
      UpdateCategoryRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات زيتية محدثة'
              },
              en: {
                type: 'string',
                example: 'Updated Oil Paintings'
              }
            }
          },
          description: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحات مرسومة بالألوان الزيتية المحدثة'
              },
              en: {
                type: 'string',
                example: 'Updated paintings created with oil colors'
              }
            }
          },
          image: {
            type: 'string',
            format: 'binary'
          },
          isActive: {
            type: 'boolean',
            example: true
          }
        }
      },
      // Artwork Schemas
      ArtworkResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          title: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لوحة فنية جميلة'
              },
              en: {
                type: 'string',
                example: 'Beautiful Artwork'
              }
            }
          },
          description: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'وصف اللوحة الفنية'
              },
              en: {
                type: 'string',
                example: 'Artwork description'
              }
            }
          },
          artist: {
            $ref: '#/components/schemas/UserResponse'
          },
          category: {
            $ref: '#/components/schemas/Category'
          },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/artwork.jpg'
                },
                publicId: {
                  type: 'string',
                  example: 'artwork_123456'
                },
                optimizedUrl: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v1612345678/artwork.jpg'
                }
              }
            }
          },
          price: {
            type: 'number',
            example: 500.00
          },
          currency: {
            type: 'string',
            enum: ['SAR', 'USD', 'EUR'],
            example: 'SAR'
          },
          dimensions: {
            type: 'object',
            properties: {
              width: {
                type: 'number',
                example: 50
              },
              height: {
                type: 'number',
                example: 70
              },
              unit: {
                type: 'string',
                enum: ['cm', 'inch', 'm'],
                example: 'cm'
              }
            }
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['فن', 'لوحة', 'زيتي']
          },
          isAvailable: {
            type: 'boolean',
            example: true
          },
          viewCount: {
            type: 'integer',
            example: 150
          },
          likeCount: {
            type: 'integer',
            example: 25
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      CreateArtworkRequest: {
        type: 'object',
        required: ['title', 'description', 'category', 'images'],
        properties: {
          title: {
            type: 'object',
            required: ['ar'],
            properties: {
              ar: {
                type: 'string',
                example: 'لوحة فنية جميلة'
              },
              en: {
                type: 'string',
                example: 'Beautiful Artwork'
              }
            }
          },
          description: {
            type: 'object',
            required: ['ar'],
            properties: {
              ar: {
                type: 'string',
                example: 'وصف اللوحة الفنية'
              },
              en: {
                type: 'string',
                example: 'Artwork description'
              }
            }
          },
          category: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary'
            },
            minItems: 1,
            maxItems: 10
          },
          price: {
            type: 'number',
            minimum: 0,
            example: 500.00
          },
          currency: {
            type: 'string',
            enum: ['SAR', 'USD', 'EUR'],
            default: 'SAR',
            example: 'SAR'
          },
          dimensions: {
            type: 'object',
            properties: {
              width: {
                type: 'number',
                minimum: 0,
                example: 50
              },
              height: {
                type: 'number',
                minimum: 0,
                example: 70
              },
              unit: {
                type: 'string',
                enum: ['cm', 'inch', 'm'],
                default: 'cm',
                example: 'cm'
              }
            }
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            maxItems: 10,
            example: ['فن', 'لوحة', 'زيتي']
          }
        }
      },
      // Chat Schemas
      ChatResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          participants: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserResponse'
            }
          },
          lastMessage: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                example: 'مرحبا، كيف حالك؟'
              },
              sender: {
                type: 'string',
                example: '60d0fe4f5311236168a109ca'
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2023-05-15T10:30:45.123Z'
              },
              isRead: {
                type: 'boolean',
                example: false
              }
            }
          },
          unreadCount: {
            type: 'integer',
            example: 3
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      MessageResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          chat: {
            type: 'string',
            example: '60d0fe4f5311236168a109cb'
          },
          sender: {
            $ref: '#/components/schemas/UserResponse'
          },
          content: {
            type: 'string',
            example: 'مرحبا، كيف حالك؟'
          },
          messageType: {
            type: 'string',
            enum: ['text', 'image', 'file'],
            example: 'text'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://res.cloudinary.com/demo/image/upload/v1612345678/message.jpg'
                },
                type: {
                  type: 'string',
                  enum: ['image', 'file'],
                  example: 'image'
                },
                filename: {
                  type: 'string',
                  example: 'image.jpg'
                }
              }
            }
          },
          isRead: {
            type: 'boolean',
            example: false
          },
          readBy: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user: {
                  type: 'string',
                  example: '60d0fe4f5311236168a109ca'
                },
                readAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2023-05-15T10:30:45.123Z'
                }
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      SendMessageRequest: {
        type: 'object',
        required: ['content'],
        properties: {
          content: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            example: 'مرحبا، كيف حالك؟'
          },
          messageType: {
            type: 'string',
            enum: ['text', 'image', 'file'],
            default: 'text',
            example: 'text'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary'
            },
            maxItems: 5
          }
        }
      },
      // Notification Schemas
      NotificationResponse: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '60d0fe4f5311236168a109ca'
          },
          recipient: {
            type: 'string',
            example: '60d0fe4f5311236168a109cb'
          },
          title: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'لديك رسالة جديدة'
              },
              en: {
                type: 'string',
                example: 'You have a new message'
              }
            }
          },
          message: {
            type: 'object',
            properties: {
              ar: {
                type: 'string',
                example: 'أرسل لك محمد رسالة جديدة'
              },
              en: {
                type: 'string',
                example: 'Mohammed sent you a new message'
              }
            }
          },
          type: {
            type: 'string',
            enum: ['message', 'artwork', 'follow', 'review', 'transaction', 'special_request'],
            example: 'message'
          },
          isRead: {
            type: 'boolean',
            example: false
          },
          data: {
            type: 'object',
            properties: {
              screen: {
                type: 'string',
                example: 'ChatScreen'
              },
              id: {
                type: 'string',
                example: '60d0fe4f5311236168a109ca'
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-15T10:30:45.123Z'
          }
        }
      },
      // Pagination Schema
      PaginationResponse: {
        type: 'object',
        properties: {
          currentPage: {
            type: 'integer',
            example: 1
          },
          totalPages: {
            type: 'integer',
            example: 5
          },
          totalItems: {
            type: 'integer',
            example: 100
          },
          itemsPerPage: {
            type: 'integer',
            example: 20
          },
          hasNextPage: {
            type: 'boolean',
            example: true
          },
          hasPrevPage: {
            type: 'boolean',
            example: false
          },
          nextPage: {
            type: 'integer',
            nullable: true,
            example: 2
          },
          prevPage: {
            type: 'integer',
            nullable: true,
            example: null
          }
        }
      }
    },
    examples: {
      RegistrationSuccess: {
        value: {
          success: true,
          message: 'تم إنشاء الحساب بنجاح',
          data: {
            user: {
              _id: '64a2f9d5ea39e815b8f35f0e',
              email: 'artist@example.com',
              displayName: 'فنان مبدع',
              role: 'artist',
              profileImage: 'https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg',
              preferredLanguage: 'ar'
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          status: 201,
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      LoginSuccess: {
        value: {
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          data: {
            user: {
              _id: '64a2f9d5ea39e815b8f35f0e',
              email: 'artist@example.com',
              displayName: 'فنان مبدع',
              role: 'artist',
              profileImage: 'https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg',
              preferredLanguage: 'ar'
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          status: 200,
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      ValidationError: {
        value: {
          success: false,
          message: 'خطأ في البيانات المدخلة',
          error: 'البريد الإلكتروني مطلوب',
          status: 400,
          validationErrors: [
            { field: 'email', message: 'يجب إدخال بريد إلكتروني صالح' },
            { field: 'password', message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
          ],
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      ImageUploadSuccess: {
        value: {
          success: true,
          message: 'تم رفع الصورة بنجاح',
          data: {
            _id: '64a2f9d5ea39e815b8f35f0e',
            url: 'https://res.cloudinary.com/demo/image/upload/v1612345678/artwork.jpg',
            publicId: 'artwork_123456',
            title: {
              ar: 'لوحة فنية جميلة',
              en: 'Beautiful Artwork'
            },
            optimizedUrl:
              'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v1612345678/artwork.jpg',
            variants: {
              thumbnail:
                'https://res.cloudinary.com/demo/image/upload/c_thumb,w_200,h_200/v1612345678/artwork.jpg',
              small:
                'https://res.cloudinary.com/demo/image/upload/c_scale,w_400/v1612345678/artwork.jpg',
              medium:
                'https://res.cloudinary.com/demo/image/upload/c_scale,w_800/v1612345678/artwork.jpg'
            }
          },
          status: 201,
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      NotFoundError: {
        value: {
          success: false,
          message: 'العنصر غير موجود',
          error: 'لم يتم العثور على صورة بهذا المعرف',
          status: 404,
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      ServerError: {
        value: {
          success: false,
          message: 'خطأ في الخادم',
          error: 'حدث خطأ أثناء الاتصال بالخدمة الخارجية',
          status: 500,
          timestamp: '2023-06-15T10:30:45.123Z',
          requestId: 'req-123abc456'
        }
      },
      UserLoginSuccess: {
        value: {
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          data: {
            token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDIxYjQ2NjdkMGQ4OTkyZTYxMGM4NSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxNjIzNTQzMTg5fQ.K2j3iq4NpCN1NWIXIo0JLc1s8a0n3uY4f5YJJXiSN5Q',
            user: {
              _id: '60d21b4667d0d8992e610c85',
              email: 'user@example.com',
              displayName: 'أحمد محمد',
              role: 'artist'
            }
          },
          status: 200,
          timestamp: '2023-06-12T08:15:30.123Z'
        }
      },
      LoginInvalidCredentials: {
        value: {
          success: false,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          status: 401,
          timestamp: '2023-06-12T08:16:30.123Z'
        }
      },
      NotificationsList: {
        value: {
          success: true,
          message: 'تم جلب الإشعارات بنجاح',
          data: {
            notifications: [
              {
                _id: '60d21b4667d0d8992e610c85',
                title: 'لديك رسالة جديدة',
                message: 'أرسل لك محمد رسالة جديدة',
                type: 'message',
                isRead: false,
                data: {
                  screen: 'ChatScreen',
                  id: '60d21b4667d0d8992e610c85'
                },
                createdAt: '2023-06-12T07:30:45.123Z'
              },
              {
                _id: '60d21b4667d0d8992e610c86',
                title: 'تم نشر عملك الفني بنجاح',
                message: 'تم نشر عملك الفني "لوحة زهور زرقاء" بنجاح',
                type: 'artwork',
                isRead: true,
                data: {
                  screen: 'ArtworkDetailScreen',
                  id: '60d21b4667d0d8992e610c90'
                },
                createdAt: '2023-06-11T15:20:30.123Z'
              }
            ],
            pagination: {
              currentPage: 1,
              totalPages: 5,
              totalItems: 25,
              unreadCount: 3
            }
          },
          status: 200,
          timestamp: '2023-06-12T08:15:30.123Z'
        }
      }
    },
    parameters: {
      languageParam: {
        name: 'language',
        in: 'query',
        description: 'اللغة المطلوبة للمحتوى (ar للعربية، en للإنجليزية)',
        required: false,
        schema: {
          type: 'string',
          enum: ['ar', 'en'],
          default: 'ar'
        }
      },
      pageParam: {
        name: 'page',
        in: 'query',
        description: 'رقم الصفحة للتصفح',
        required: false,
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1
        }
      },
      limitParam: {
        name: 'limit',
        in: 'query',
        description: 'عدد العناصر في الصفحة',
        required: false,
        schema: {
          type: 'integer',
          default: 20,
          minimum: 1,
          maximum: 100
        }
      },
      optimizationLevelParam: {
        name: 'optimizationLevel',
        in: 'query',
        description: 'مستوى تحسين الصور (low, medium, high)',
        required: false,
        schema: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'واجهات API للمصادقة وإدارة المستخدمين',
      'x-displayName': 'المصادقة'
    },
    {
      name: 'Images',
      description: 'واجهات API لرفع وإدارة الصور',
      'x-displayName': 'الصور'
    },
    {
      name: 'Artworks',
      description: 'واجهات API لإدارة الأعمال الفنية',
      'x-displayName': 'الأعمال الفنية'
    },
    {
      name: 'Chat',
      description: 'واجهات API للمحادثات والرسائل',
      'x-displayName': 'المحادثات'
    },
    {
      name: 'Categories',
      description: 'واجهات API لإدارة التصنيفات',
      'x-displayName': 'التصنيفات'
    },
    {
      name: 'Reviews',
      description: 'واجهات API للتقييمات والمراجعات',
      'x-displayName': 'التقييمات'
    },
    {
      name: 'Home',
      description: 'واجهات API للشاشة الرئيسية',
      'x-displayName': 'الرئيسية'
    },
    {
      name: 'Special Requests',
      description: 'واجهات API لإدارة الطلبات الخاصة',
      'x-displayName': 'الطلبات الخاصة'
    },
    {
      name: 'Reports',
      description: 'واجهات API لنظام الإبلاغ عن المحتوى',
      'x-displayName': 'البلاغات'
    },
    {
      name: 'Transactions',
      description: 'واجهات API للمعاملات المالية والدفع',
      'x-displayName': 'المعاملات المالية'
    },
    {
      name: 'Follow',
      description: 'واجهات API لمتابعة/إلغاء متابعة الفنانين',
      'x-displayName': 'المتابعة'
    },
    {
      name: 'Notifications',
      description: 'واجهات API لإدارة إشعارات المستخدم',
      'x-displayName': 'الإشعارات'
    },
    {
      name: 'Settings',
      description: 'واجهات API لإعدادات المستخدم',
      'x-displayName': 'الإعدادات'
    },
    {
      name: 'Profile',
      description: 'واجهات API لإدارة الملفات الشخصية',
      'x-displayName': 'الملف الشخصي'
    },
    {
      name: 'Users',
      description: 'واجهات API لإدارة المستخدمين',
      'x-displayName': 'المستخدمين'
    }
  ],
  'x-tagGroups': [
    {
      name: 'الشاشات الرئيسية',
      tags: ['Authentication', 'Home', 'Profile', 'Artworks', 'Images']
    },
    {
      name: 'التواصل',
      tags: ['Chat', 'Notifications', 'Follow']
    },
    {
      name: 'المعاملات',
      tags: ['Transactions', 'Special Requests']
    },
    {
      name: 'المحتوى',
      tags: ['Categories', 'Reviews', 'Reports']
    },
    {
      name: 'الإدارة',
      tags: ['Users', 'Settings']
    }
  ]
};
