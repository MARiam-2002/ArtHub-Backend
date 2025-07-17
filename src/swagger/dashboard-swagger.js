/**
 * Dashboard Swagger Documentation
 * لوحة التحكم الرئيسية - إحصائيات وبيانات أساسية
 */

export const dashboardPaths = {
  '/api/dashboard/statistics': {
    get: {
      tags: ['Dashboard'],
      summary: 'الإحصائيات الرئيسية للوحة التحكم',
      description: 'جلب الإحصائيات الرئيسية للمنصة (المستخدمين، الإيرادات، الأعمال الفنية، الطلبات)',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب الإحصائيات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب الإحصائيات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'number',
                            example: 12847
                          },
                          active: {
                            type: 'number',
                            example: 11000
                          },
                          artists: {
                            type: 'number',
                            example: 3429
                          },
                          activeArtists: {
                            type: 'number',
                            example: 3200
                          }
                        }
                      },
                      revenue: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'number',
                            example: 1545118
                          },
                          currency: {
                            type: 'string',
                            example: 'SAR'
                          }
                        }
                      },
                      artworks: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'number',
                            example: 850
                          },
                          available: {
                            type: 'number',
                            example: 600
                          },
                          sold: {
                            type: 'number',
                            example: 250
                          }
                        }
                      },
                      orders: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'number',
                            example: 1355
                          },
                          pending: {
                            type: 'number',
                            example: 89
                          },
                          completed: {
                            type: 'number',
                            example: 1243
                          },
                          rejected: {
                            type: 'number',
                            example: 23
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح - يرجى تسجيل الدخول'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'ممنوع - تحتاج صلاحيات إدارية'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/charts': {
    get: {
      tags: ['Dashboard'],
      summary: 'بيانات الرسوم البيانية',
      description: 'جلب بيانات الرسوم البيانية للإيرادات والطلبات',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['1month', '3months', '6months', '9months', '12months'],
            default: '12months'
          },
          description: 'الفترة الزمنية للبيانات',
          example: '12months'
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
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب بيانات الرسوم البيانية بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      revenue: {
                        type: 'object',
                        properties: {
                          labels: {
                            type: 'array',
                            items: {
                              type: 'string'
                            },
                            example: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
                          },
                          data: {
                            type: 'array',
                            items: {
                              type: 'number'
                            },
                            example: [120000, 135000, 142000, 138000, 156000, 168000, 175000, 182000, 195000, 210000, 225000, 240000]
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              yearly: {
                                type: 'number',
                                example: 847392
                              },
                              monthly: {
                                type: 'number',
                                example: 124500
                              },
                              weekly: {
                                type: 'number',
                                example: 28900
                              }
                            }
                          }
                        }
                      },
                      orders: {
                        type: 'object',
                        properties: {
                          labels: {
                            type: 'array',
                            items: {
                              type: 'string'
                            },
                            example: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
                          },
                          data: {
                            type: 'array',
                            items: {
                              type: 'number'
                            },
                            example: [85, 92, 98, 105, 112, 118, 125, 132, 140, 148, 156, 165]
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              pending: {
                                type: 'number',
                                example: 89
                              },
                              completed: {
                                type: 'number',
                                example: 1243
                              },
                              rejected: {
                                type: 'number',
                                example: 23
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح - يرجى تسجيل الدخول'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'ممنوع - تحتاج صلاحيات إدارية'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/artists/performance': {
    get: {
      tags: ['Dashboard'],
      summary: 'أفضل الفنانين أداءً',
      description: 'جلب قائمة أفضل الفنانين أداءً مع مقاييسهم',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            default: 3
          },
          description: 'عدد الفنانين المطلوب عرضهم',
          example: 3
        },
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['weekly', 'monthly', 'yearly'],
            default: 'monthly'
          },
          description: 'الفترة الزمنية لحساب الأداء',
          example: 'monthly'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب بيانات الفنانين بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب بيانات الفنانين بنجاح'
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: {
                          type: 'string',
                          example: '507f1f77bcf86cd799439011'
                        },
                        displayName: {
                          type: 'string',
                          example: 'مريم خالد'
                        },
                        profileImage: {
                          type: 'string',
                          example: 'https://example.com/profile.jpg'
                        },
                        job: {
                          type: 'string',
                          example: 'فن رقمي'
                        },
                        performance: {
                          type: 'object',
                          properties: {
                            sales: {
                              type: 'number',
                              example: 1175
                            },
                            rating: {
                              type: 'number',
                              example: 4.7
                            },
                            artworks: {
                              type: 'number',
                              example: 28
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح - يرجى تسجيل الدخول'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'ممنوع - تحتاج صلاحيات إدارية'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/sales/analytics': {
    get: {
      tags: ['Dashboard'],
      summary: 'تحليل المبيعات - إحصائيات عامة',
      description: 'جلب إحصائيات المبيعات العامة مع أفضل فنان مبيعاً والنسب المئوية',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['7days', '30days', '90days', '1year'],
            default: '30days'
          },
          description: 'الفترة الزمنية للإحصائيات'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تحليل المبيعات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب تحليل المبيعات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'string',
                        example: '30days'
                      },
                      topSellingArtist: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            example: 'أحمد محمد'
                          },
                          image: {
                            type: 'string',
                            example: 'https://example.com/profile.jpg'
                          },
                          sales: {
                            type: 'number',
                            example: 125000
                          },
                          orders: {
                            type: 'number',
                            example: 25
                          }
                        }
                      },
                      totalOrders: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'number',
                            example: 168
                          },
                          percentageChange: {
                            type: 'number',
                            example: -5
                          },
                          isPositive: {
                            type: 'boolean',
                            example: false
                          }
                        }
                      },
                      totalSales: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'number',
                            example: 12847
                          },
                          percentageChange: {
                            type: 'number',
                            example: 20
                          },
                          isPositive: {
                            type: 'boolean',
                            example: true
                          }
                        }
                      },
                      averageOrderValue: {
                        type: 'number',
                        example: 765.89
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'غير مصرح لك بالوصول لهذا المورد'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/sales/trends': {
    get: {
      tags: ['Dashboard'],
      summary: 'تتبع المبيعات - بيانات الرسم البياني',
      description: 'جلب بيانات الرسم البياني لتتبع المبيعات الشهرية',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['1month', '3months', '6months', '9months', '12months'],
            default: '12months'
          },
          description: 'الفترة الزمنية للرسم البياني'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب بيانات تتبع المبيعات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب بيانات تتبع المبيعات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'string',
                        example: '12months'
                      },
                      chartData: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: {
                              type: 'string',
                              example: 'يناير'
                            },
                            sales: {
                              type: 'number',
                              example: 250000
                            },
                            orders: {
                              type: 'number',
                              example: 167
                            }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalSales: {
                            type: 'number',
                            example: 847392,
                            description: 'إجمالي المبيعات للفترة المحددة'
                          },
                          totalOrders: {
                            type: 'number',
                            example: 1243,
                            description: 'عدد الطلبات للفترة المحددة'
                          },
                          averageMonthlySales: {
                            type: 'number',
                            example: 70616,
                            description: 'متوسط المبيعات الشهرية'
                          },
                          topSellingArtist: {
                            type: 'object',
                            description: 'الفنان الأكثر مبيعاً للفترة المحددة',
                            properties: {
                              name: {
                                type: 'string',
                                example: 'أحمد محمد',
                                description: 'اسم الفنان'
                              },
                              image: {
                                type: 'string',
                                example: 'https://example.com/profile.jpg',
                                description: 'صورة الفنان'
                              },
                              sales: {
                                type: 'number',
                                example: 125000,
                                description: 'إجمالي مبيعات الفنان'
                              },
                              orders: {
                                type: 'number',
                                example: 25,
                                description: 'عدد طلبات الفنان'
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'غير مصرح لك بالوصول لهذا المورد'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/sales/top-artists': {
    get: {
      tags: ['Dashboard'],
      summary: 'أفضل الفنانين مبيعاً',
      description: 'جلب قائمة أفضل الفنانين مبيعاً مع إحصائيات النمو',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['7days', '30days', '90days', '1year'],
            default: '30days'
          },
          description: 'الفترة الزمنية'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            default: 10
          },
          description: 'عدد الفنانين المطلوب عرضهم'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب أفضل الفنانين مبيعاً بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب أفضل الفنانين مبيعاً بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'string',
                        example: '30days'
                      },
                      artists: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: {
                              type: 'string',
                              example: '507f1f77bcf86cd799439011'
                            },
                            name: {
                              type: 'string',
                              example: 'أحمد محمد'
                            },
                            image: {
                              type: 'string',
                              example: 'https://example.com/profile.jpg'
                            },
                            job: {
                              type: 'string',
                              example: 'فنان تشكيلي'
                            },
                            orderCount: {
                              type: 'number',
                              example: 25
                            },
                            sales: {
                              type: 'number',
                              example: 125000
                            },
                            growth: {
                              type: 'object',
                              properties: {
                                percentage: {
                                  type: 'number',
                                  example: 12
                                },
                                isPositive: {
                                  type: 'boolean',
                                  example: true
                                }
                              }
                            }
                          }
                        }
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalArtists: {
                            type: 'number',
                            example: 10
                          },
                          totalSales: {
                            type: 'number',
                            example: 847392
                          },
                          averageGrowth: {
                            type: 'number',
                            example: 8
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'غير مصرح لك بالوصول لهذا المورد'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/dashboard/sales/report': {
    get: {
      tags: ['Dashboard'],
      summary: 'تحميل تقرير المبيعات',
      description: 'تحميل تقرير مفصل للمبيعات بصيغة JSON أو CSV',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['7days', '30days', '90days', '1year'],
            default: '30days'
          },
          description: 'الفترة الزمنية للتقرير'
        },
        {
          in: 'query',
          name: 'format',
          schema: {
            type: 'string',
            enum: ['json', 'csv'],
            default: 'json'
          },
          description: 'صيغة التقرير'
        }
      ],
      responses: {
        200: {
          description: 'تم إنشاء تقرير المبيعات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم إنشاء تقرير المبيعات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      period: {
                        type: 'string',
                        example: '30days'
                      },
                      generatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-18T10:30:00.000Z'
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          totalSales: {
                            type: 'number',
                            example: 847392
                          },
                          totalOrders: {
                            type: 'number',
                            example: 1243
                          },
                          averageOrderValue: {
                            type: 'number',
                            example: 681.57
                          }
                        }
                      },
                      topArtists: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: {
                              type: 'string',
                              example: 'أحمد محمد'
                            },
                            sales: {
                              type: 'number',
                              example: 125000
                            },
                            orders: {
                              type: 'number',
                              example: 25
                            }
                          }
                        }
                      },
                      monthlyTrends: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: {
                              type: 'string',
                              example: '2025-01'
                            },
                            sales: {
                              type: 'number',
                              example: 250000
                            },
                            orders: {
                              type: 'number',
                              example: 167
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
        401: {
          description: 'غير مصرح',
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
                    example: 'غير مصرح'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'ممنوع - للمديرين فقط',
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
                    example: 'غير مصرح لك بالوصول لهذا المورد'
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
