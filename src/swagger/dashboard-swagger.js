/**
 * Dashboard Swagger Documentation
 * توثيق واجهات API للوحة التحكم الإدارية
 */

export const dashboardPaths = {
  '/api/dashboard/statistics': {
    get: {
      tags: ['Dashboard'],
      summary: 'احصائيات لوحة التحكم الرئيسية',
      description: 'جلب الإحصائيات الرئيسية للوحة التحكم مثل عدد المستخدمين والفنانين والإيرادات',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب الإحصائيات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Dashboard statistics fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 1250 },
                          active: { type: 'integer', example: 1100 },
                          artists: { type: 'integer', example: 300 },
                          activeArtists: { type: 'integer', example: 280 }
                        }
                      },
                      revenue: {
                        type: 'object',
                        properties: {
                          total: { type: 'number', example: 45000.50 },
                          currency: { type: 'string', example: 'SAR' }
                        }
                      },
                      artworks: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 850 },
                          available: { type: 'integer', example: 600 },
                          sold: { type: 'integer', example: 250 }
                        }
                      },
                      orders: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 320 },
                          pending: { type: 'integer', example: 25 },
                          completed: { type: 'integer', example: 280 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/dashboard/charts': {
    get: {
      tags: ['Dashboard'],
      summary: 'بيانات الرسوم البيانية',
      description: 'جلب بيانات الرسوم البيانية للطلبات والإيرادات',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'period',
          in: 'query',
          description: 'الفترة الزمنية للبيانات',
          required: false,
          schema: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            default: 'monthly'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب بيانات الرسوم البيانية بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Dashboard charts data fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      period: { type: 'string', example: 'monthly' },
                      orders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'object' },
                            totalOrders: { type: 'integer', example: 45 },
                            completedOrders: { type: 'integer', example: 40 },
                            pendingOrders: { type: 'integer', example: 5 }
                          }
                        }
                      },
                      revenue: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'object' },
                            totalRevenue: { type: 'number', example: 15000.50 },
                            averageOrderValue: { type: 'number', example: 375.25 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/users': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة المستخدمين',
      description: 'جلب قائمة المستخدمين مع إمكانية التصفية والبحث',
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        {
          name: 'role',
          in: 'query',
          description: 'تصفية حسب الدور',
          required: false,
          schema: {
            type: 'string',
            enum: ['user', 'artist', 'admin', 'superadmin']
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'تصفية حسب الحالة',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'inactive', 'banned']
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'البحث في الأسماء والإيميلات',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة المستخدمين بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Users fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          currentPage: { type: 'integer', example: 1 },
                          totalPages: { type: 'integer', example: 25 },
                          totalUsers: { type: 'integer', example: 250 },
                          hasNextPage: { type: 'boolean', example: true },
                          hasPrevPage: { type: 'boolean', example: false }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/users/{id}': {
    get: {
      tags: ['Dashboard'],
      summary: 'تفاصيل المستخدم',
      description: 'جلب تفاصيل مستخدم محدد مع إحصائياته',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المستخدم',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تفاصيل المستخدم بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User details fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      stats: {
                        type: 'object',
                        properties: {
                          artworks: { type: 'integer', example: 15 },
                          sales: { type: 'integer', example: 8 },
                          totalEarnings: { type: 'number', example: 2500.75 },
                          reviews: { type: 'integer', example: 12 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'المستخدم غير موجود'
        }
      }
    }
  },

  '/api/dashboard/users/{id}/status': {
    patch: {
      tags: ['Dashboard'],
      summary: 'تحديث حالة المستخدم',
      description: 'تحديث حالة المستخدم (نشط، غير نشط، محظور)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المستخدم',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'banned'],
                  description: 'الحالة الجديدة للمستخدم'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث حالة المستخدم بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User status updated successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/orders': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة الطلبات',
      description: 'جلب قائمة الطلبات والمعاملات',
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        {
          name: 'status',
          in: 'query',
          description: 'تصفية حسب حالة الطلب',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded']
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'البحث في رقم المعاملة',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة الطلبات بنجاح'
        }
      }
    }
  },

  '/api/dashboard/reviews': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة التقييمات',
      description: 'جلب قائمة التقييمات للمراجعة والإدارة',
      security: [{ BearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        {
          name: 'status',
          in: 'query',
          description: 'تصفية حسب حالة التقييم',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected']
          }
        },
        {
          name: 'rating',
          in: 'query',
          description: 'تصفية حسب التقييم',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 5
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة التقييمات بنجاح'
        }
      }
    }
  },

  '/api/dashboard/reviews/{id}/status': {
    patch: {
      tags: ['Dashboard'],
      summary: 'تحديث حالة التقييم',
      description: 'الموافقة على التقييم أو رفضه',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف التقييم',
          schema: {
            type: 'string'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'approved', 'rejected'],
                  description: 'الحالة الجديدة للتقييم'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث حالة التقييم بنجاح'
        }
      }
    }
  },

  '/api/dashboard/notifications': {
    post: {
      tags: ['Dashboard'],
      summary: 'إرسال إشعار',
      description: 'إرسال إشعار لمستخدم محدد أو لجميع المستخدمين',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'message'],
              properties: {
                title: {
                  type: 'string',
                  description: 'عنوان الإشعار',
                  example: 'إشعار مهم'
                },
                message: {
                  type: 'string',
                  description: 'محتوى الإشعار',
                  example: 'هذا إشعار مهم لجميع المستخدمين'
                },
                type: {
                  type: 'string',
                  enum: ['request', 'message', 'review', 'system', 'other'],
                  default: 'system',
                  description: 'نوع الإشعار'
                },
                userId: {
                  type: 'string',
                  description: 'معرف المستخدم (إذا كان الإرسال لمستخدم واحد)'
                },
                sendToAll: {
                  type: 'boolean',
                  default: false,
                  description: 'إرسال لجميع المستخدمين'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم إرسال الإشعار بنجاح'
        }
      }
    }
  },

  '/api/dashboard/artists/top': {
    get: {
      tags: ['Dashboard'],
      summary: 'أفضل الفنانين',
      description: 'جلب قائمة أفضل الفنانين أداءً',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'عدد الفنانين المطلوب عرضهم',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 50
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة أفضل الفنانين بنجاح'
        }
      }
    }
  },

  '/api/dashboard/activities': {
    get: {
      tags: ['Dashboard'],
      summary: 'الأنشطة الحديثة',
      description: 'جلب الأنشطة والأحداث الحديثة في المنصة',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'عدد الأنشطة المطلوب عرضها',
          required: false,
          schema: {
            type: 'integer',
            default: 20,
            minimum: 1,
            maximum: 50
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب الأنشطة الحديثة بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Recent activities fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      orders: {
                        type: 'array',
                        description: 'أحدث الطلبات'
                      },
                      users: {
                        type: 'array',
                        description: 'أحدث المستخدمين'
                      },
                      reviews: {
                        type: 'array',
                        description: 'أحدث التقييمات'
                      },
                      reports: {
                        type: 'array',
                        description: 'أحدث التقارير'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 