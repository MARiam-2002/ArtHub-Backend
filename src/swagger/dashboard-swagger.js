/**
 * Dashboard Swagger Documentation
 * توثيق واجهات API للوحة التحكم الإدارية
 */

export const dashboardPaths = {
  '/api/v1/dashboard/overview': {
    get: {
      tags: ['Dashboard'],
      summary: 'نظرة عامة على النظام',
      description: 'الحصول على نظرة عامة شاملة على النظام مع جميع المؤشرات الرئيسية',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب نظرة عامة على النظام بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'System overview fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      overview: {
                        type: 'object',
                        properties: {
                          users: {
                            type: 'object',
                            properties: {
                              totalUsers: { type: 'integer', example: 12847 },
                              activeUsers: { type: 'integer', example: 10234 },
                              totalArtists: { type: 'integer', example: 3429 },
                              activeArtists: { type: 'integer', example: 2891 }
                            }
                          },
                          revenue: {
                            type: 'object',
                            properties: {
                              totalRevenue: { type: 'number', example: 1545118 },
                              totalOrders: { type: 'integer', example: 1243 },
                              averageOrderValue: { type: 'number', example: 1243.5 }
                            }
                          },
                          artworks: {
                            type: 'object',
                            properties: {
                              totalArtworks: { type: 'integer', example: 5678 },
                              availableArtworks: { type: 'integer', example: 4321 },
                              soldArtworks: { type: 'integer', example: 1357 }
                            }
                          },
                          reviews: {
                            type: 'object',
                            properties: {
                              totalReviews: { type: 'integer', example: 3456 },
                              averageRating: { type: 'number', example: 4.5 },
                              pendingReviews: { type: 'integer', example: 23 }
                            }
                          },
                          reports: {
                            type: 'object',
                            properties: {
                              totalReports: { type: 'integer', example: 89 },
                              pendingReports: { type: 'integer', example: 12 }
                            }
                          },
                          specialRequests: {
                            type: 'object',
                            properties: {
                              totalRequests: { type: 'integer', example: 234 },
                              pendingRequests: { type: 'integer', example: 45 }
                            }
                          }
                        }
                      },
                      currency: { type: 'string', example: 'SAR' },
                      lastUpdated: { type: 'string', format: 'date-time' }
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

  '/api/v1/dashboard/statistics': {
    get: {
      tags: ['Dashboard'],
      summary: 'الإحصائيات الرئيسية',
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
                      },
                      reviews: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 150 },
                          pending: { type: 'integer', example: 10 },
                          averageRating: { type: 'number', example: 4.5 }
                        }
                      },
                      reports: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 45 },
                          pending: { type: 'integer', example: 8 }
                        }
                      },
                      specialRequests: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 67 },
                          pending: { type: 'integer', example: 12 }
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

  '/api/v1/dashboard/revenue': {
    get: {
      tags: ['Dashboard'],
      summary: 'إحصائيات الإيرادات',
      description: 'الحصول على إحصائيات مفصلة للإيرادات مع المقارنة',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'period',
          in: 'query',
          description: 'الفترة الزمنية للمقارنة',
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
          description: 'تم جلب إحصائيات الإيرادات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Revenue statistics fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      currentRevenue: { type: 'number', example: 1545118 },
                      previousRevenue: { type: 'number', example: 1287456 },
                      percentageChange: { type: 'number', example: 20.0 },
                      breakdown: {
                        type: 'object',
                        properties: {
                          total: { type: 'number', example: 1545118 },
                          monthly: { type: 'number', example: 124500 },
                          weekly: { type: 'number', example: 28900 },
                          averageOrderValue: { type: 'number', example: 1243.5 },
                          totalOrders: { type: 'integer', example: 1243 }
                        }
                      },
                      currency: { type: 'string', example: 'SAR' }
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

  '/api/v1/dashboard/orders/statistics': {
    get: {
      tags: ['Dashboard'],
      summary: 'إحصائيات الطلبات',
      description: 'الحصول على إحصائيات مفصلة للطلبات مع تقسيم الحالات',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب إحصائيات الطلبات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Order statistics fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      statusBreakdown: {
                        type: 'object',
                        properties: {
                          pending: { type: 'integer', example: 89 },
                          completed: { type: 'integer', example: 1154 },
                          cancelled: { type: 'integer', example: 23 },
                          rejected: { type: 'integer', example: 0 }
                        }
                      },
                      monthlyOrders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'object' },
                            totalOrders: { type: 'integer', example: 156 },
                            completedOrders: { type: 'integer', example: 134 },
                            pendingOrders: { type: 'integer', example: 12 },
                            cancelledOrders: { type: 'integer', example: 10 }
                          }
                        }
                      },
                      dailyOrders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'object' },
                            totalOrders: { type: 'integer', example: 5 },
                            completedOrders: { type: 'integer', example: 4 }
                          }
                        }
                      },
                      totalOrders: { type: 'integer', example: 1266 }
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

  '/api/v1/dashboard/charts': {
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
                      },
                      newUsers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'object' },
                            newUsers: { type: 'integer', example: 234 },
                            newArtists: { type: 'integer', example: 45 }
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
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/v1/dashboard/artists/performance': {
    get: {
      tags: ['Dashboard'],
      summary: 'أداء الفنانين',
      description: 'الحصول على أداء الفنانين الأفضل مع المؤشرات المفصلة',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'عدد الفنانين المطلوب',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 50
          }
        },
        {
          name: 'period',
          in: 'query',
          description: 'الفترة الزمنية لحساب الأداء',
          required: false,
          schema: {
            type: 'string',
            enum: ['weekly', 'monthly', 'yearly'],
            default: 'monthly'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب أداء الفنانين بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Artists performance data fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      artists: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            displayName: { type: 'string', example: 'مريم خالد' },
                            email: { type: 'string', example: 'mariam@example.com' },
                            profileImage: { type: 'string', example: 'https://example.com/profile1.jpg' },
                            job: { type: 'string', example: 'فن رقمي' },
                            isVerified: { type: 'boolean', example: true },
                            metrics: {
                              type: 'object',
                              properties: {
                                totalSales: { type: 'integer', example: 28 },
                                totalRevenue: { type: 'number', example: 1175.0 },
                                averageOrderValue: { type: 'number', example: 41.96 },
                                artworksCount: { type: 'integer', example: 28 },
                                averageRating: { type: 'number', example: 4.7 },
                                reviewsCount: { type: 'integer', example: 15 }
                              }
                            }
                          }
                        }
                      },
                      period: { type: 'string', example: 'monthly' },
                      totalArtists: { type: 'integer', example: 3 }
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

  '/api/v1/dashboard/users': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة المستخدمين',
      description: 'جلب قائمة المستخدمين مع إمكانية التصفية والبحث',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'رقم الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'عدد العناصر في الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
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
            type: 'string',
            minLength: 2,
            maxLength: 50
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
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/v1/dashboard/users/{id}': {
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
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
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
                          totalEarnings: { type: 'number', example: 2500.50 },
                          purchases: { type: 'integer', example: 12 },
                          totalSpent: { type: 'number', example: 1800.75 },
                          reviews: { type: 'integer', example: 5 },
                          reports: { type: 'integer', example: 0 }
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
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' },
        404: { description: 'المستخدم غير موجود' }
      }
    }
  },

  '/api/v1/dashboard/users/{id}/status': {
    patch: {
      tags: ['Dashboard'],
      summary: 'تحديث حالة المستخدم',
      description: 'تحديث حالة المستخدم (active, inactive, banned)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المستخدم',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
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
        },
        400: { description: 'حالة غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' },
        404: { description: 'المستخدم غير موجود' }
      }
    }
  },

  '/api/v1/dashboard/orders': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة الطلبات',
      description: 'جلب قائمة الطلبات مع إمكانية التصفية والبحث',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'رقم الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'عدد العناصر في الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
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
          description: 'البحث في رقم الطلب',
          required: false,
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 50
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة الطلبات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Orders fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      orders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            transactionNumber: { type: 'string', example: 'TXN-2024-001' },
                            status: { type: 'string', example: 'completed' },
                            buyer: { $ref: '#/components/schemas/User' },
                            seller: { $ref: '#/components/schemas/User' },
                            items: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  artwork: {
                                    type: 'object',
                                    properties: {
                                      _id: { type: 'string' },
                                      title: { type: 'string' },
                                      image: { type: 'string' }
                                    }
                                  },
                                  quantity: { type: 'integer', example: 1 },
                                  price: { type: 'number', example: 500.00 }
                                }
                              }
                            },
                            pricing: {
                              type: 'object',
                              properties: {
                                subtotal: { type: 'number', example: 500.00 },
                                tax: { type: 'number', example: 25.00 },
                                shipping: { type: 'number', example: 30.00 },
                                totalAmount: { type: 'number', example: 555.00 }
                              }
                            },
                            createdAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          currentPage: { type: 'integer', example: 1 },
                          totalPages: { type: 'integer', example: 15 },
                          totalOrders: { type: 'integer', example: 150 },
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
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/v1/dashboard/orders/{id}': {
    get: {
      tags: ['Dashboard'],
      summary: 'تفاصيل الطلب',
      description: 'جلب تفاصيل طلب محدد',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف الطلب',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تفاصيل الطلب بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Order details fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      order: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          transactionNumber: { type: 'string', example: 'TXN-2024-001' },
                          status: { type: 'string', example: 'completed' },
                          buyer: { $ref: '#/components/schemas/User' },
                          seller: { $ref: '#/components/schemas/User' },
                          items: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                artwork: {
                                  type: 'object',
                                  properties: {
                                    _id: { type: 'string' },
                                    title: { type: 'string' },
                                    image: { type: 'string' },
                                    description: { type: 'string' },
                                    price: { type: 'number' }
                                  }
                                },
                                quantity: { type: 'integer', example: 1 },
                                price: { type: 'number', example: 500.00 }
                              }
                            }
                          },
                          pricing: {
                            type: 'object',
                            properties: {
                              subtotal: { type: 'number', example: 500.00 },
                              tax: { type: 'number', example: 25.00 },
                              shipping: { type: 'number', example: 30.00 },
                              totalAmount: { type: 'number', example: 555.00 }
                            }
                          },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' }
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
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' },
        404: { description: 'الطلب غير موجود' }
      }
    }
  },

  '/api/v1/dashboard/reviews': {
    get: {
      tags: ['Dashboard'],
      summary: 'قائمة التقييمات',
      description: 'جلب قائمة التقييمات مع إمكانية التصفية',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'رقم الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'عدد العناصر في الصفحة',
          required: false,
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          }
        },
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
          description: 'تم جلب قائمة التقييمات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Reviews fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            rating: { type: 'integer', example: 5 },
                            comment: { type: 'string', example: 'عمل رائع!' },
                            status: { type: 'string', example: 'approved' },
                            user: { $ref: '#/components/schemas/User' },
                            artist: { $ref: '#/components/schemas/User' },
                            artwork: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string' },
                                title: { type: 'string' },
                                image: { type: 'string' }
                              }
                            },
                            createdAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          currentPage: { type: 'integer', example: 1 },
                          totalPages: { type: 'integer', example: 10 },
                          totalReviews: { type: 'integer', example: 100 },
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
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/v1/dashboard/reviews/{id}/status': {
    patch: {
      tags: ['Dashboard'],
      summary: 'تحديث حالة التقييم',
      description: 'تحديث حالة التقييم (pending, approved, rejected)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف التقييم',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
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
          description: 'تم تحديث حالة التقييم بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Review status updated successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      review: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          rating: { type: 'integer', example: 5 },
                          comment: { type: 'string', example: 'عمل رائع!' },
                          status: { type: 'string', example: 'approved' },
                          user: { $ref: '#/components/schemas/User' },
                          artwork: {
                            type: 'object',
                            properties: {
                              _id: { type: 'string' },
                              title: { type: 'string' }
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
        400: { description: 'حالة غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' },
        404: { description: 'التقييم غير موجود' }
      }
    }
  },

  '/api/v1/dashboard/notifications': {
    post: {
      tags: ['Dashboard'],
      summary: 'إرسال إشعار',
      description: 'إرسال إشعار إلى مستخدم محدد أو جميع المستخدمين',
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
                  minLength: 3,
                  maxLength: 100,
                  description: 'عنوان الإشعار'
                },
                message: {
                  type: 'string',
                  minLength: 10,
                  maxLength: 500,
                  description: 'محتوى الإشعار'
                },
                type: {
                  type: 'string',
                  enum: ['request', 'message', 'review', 'system', 'other'],
                  default: 'system',
                  description: 'نوع الإشعار'
                },
                userId: {
                  type: 'string',
                  pattern: '^[0-9a-fA-F]{24}$',
                  description: 'معرف المستخدم (مطلوب إذا لم يكن sendToAll = true)'
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
          description: 'تم إرسال الإشعار بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Notification sent successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      notification: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          title: { type: 'string', example: 'إشعار مهم' },
                          message: { type: 'string', example: 'هذا إشعار تجريبي' },
                          type: { type: 'string', example: 'system' },
                          user: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      },
                      sentCount: { type: 'integer', example: 1250 }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'بيانات غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' },
        404: { description: 'المستخدم غير موجود' }
      }
    }
  },

  '/api/v1/dashboard/artists/top': {
    get: {
      tags: ['Dashboard'],
      summary: 'الفنانين الأفضل',
      description: 'جلب قائمة الفنانين الأفضل أداءً',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'عدد الفنانين المطلوب',
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
          description: 'تم جلب الفنانين الأفضل بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Top artists fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      artists: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            totalSales: { type: 'integer', example: 28 },
                            totalRevenue: { type: 'number', example: 1175.0 },
                            averageRating: { type: 'number', example: 4.7 },
                            artist: {
                              type: 'object',
                              properties: {
                                displayName: { type: 'string', example: 'مريم خالد' },
                                email: { type: 'string', example: 'mariam@example.com' },
                                profileImage: { type: 'string', example: 'https://example.com/profile1.jpg' }
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
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  },

  '/api/v1/dashboard/activities': {
    get: {
      tags: ['Dashboard'],
      summary: 'النشاطات الأخيرة',
      description: 'جلب النشاطات الأخيرة في النظام',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'عدد النشاطات المطلوبة',
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
          description: 'تم جلب النشاطات الأخيرة بنجاح',
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
                      recentOrders: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            transactionNumber: { type: 'string', example: 'TXN-2024-001' },
                            status: { type: 'string', example: 'completed' },
                            buyer: { type: 'string', example: 'أحمد محمد' },
                            seller: { type: 'string', example: 'مريم خالد' },
                            totalAmount: { type: 'number', example: 555.00 },
                            createdAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      recentUsers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            displayName: { type: 'string', example: 'أحمد محمد' },
                            email: { type: 'string', example: 'ahmed@example.com' },
                            role: { type: 'string', example: 'user' },
                            createdAt: { type: 'string', format: 'date-time' }
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
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات إدارية مطلوبة' }
      }
    }
  }
}; 