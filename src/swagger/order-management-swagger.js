/**
 * Order Management Swagger Documentation
 * إدارة الطلبات - توثيق API
 */

export const orderManagementPaths = {
  '/api/admin/orders': {
    get: {
      tags: ['Order Management'],
      summary: 'جلب جميع الطلبات (بدون فلترة، فقط pagination)',
      description: 'جلب جميع الطلبات (طلبات خاصة + معاملات شراء) مع دعم pagination فقط. كل الفلترة والبحث تتم من الفرونت فقط.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20 },
          description: 'عدد العناصر في الصفحة'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب الطلبات بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      orders: { type: 'array', items: { type: 'object' } },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 20 },
                          total: { type: 'integer', example: 150 },
                          pages: { type: 'integer', example: 8 }
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

  '/api/admin/orders/{id}': {
    get: {
      tags: ['Order Management'],
      summary: 'جلب تفاصيل طلب واحد',
      description: 'جلب تفاصيل كاملة لطلب معين مع إحصائيات الفنان والعميل',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الطلب'
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
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب تفاصيل الطلب بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      title: {
                        type: 'string',
                        example: 'لوحة زيتية مخصصة'
                      },
                      description: {
                        type: 'string',
                        example: 'وصف تفصيلي للطلب'
                      },
                      requestType: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'string',
                            example: 'custom_artwork'
                          },
                          label: {
                            type: 'string',
                            example: 'عمل فني مخصص'
                          }
                        }
                      },
                      budget: {
                        type: 'number',
                        example: 850
                      },
                      quotedPrice: {
                        type: 'number',
                        example: 900
                      },
                      finalPrice: {
                        type: 'number',
                        example: 900
                      },
                      currency: {
                        type: 'string',
                        example: 'SAR'
                      },
                      status: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'string',
                            example: 'completed'
                          },
                          label: {
                            type: 'string',
                            example: 'مكتمل'
                          },
                          color: {
                            type: 'string',
                            example: '#4CAF50'
                          }
                        }
                      },
                      priority: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'string',
                            example: 'medium'
                          },
                          label: {
                            type: 'string',
                            example: 'متوسطة'
                          }
                        }
                      },
                      artist: {
                        type: 'object',
                        properties: {
                          _id: {
                            type: 'string'
                          },
                          displayName: {
                            type: 'string',
                            example: 'أحمد محمد'
                          },
                          profileImage: {
                            type: 'string'
                          },
                          email: {
                            type: 'string'
                          },
                          phone: {
                            type: 'string'
                          },
                          job: {
                            type: 'string'
                          },
                          stats: {
                            type: 'object',
                            properties: {
                              totalOrders: {
                                type: 'integer'
                              },
                              completedOrders: {
                                type: 'integer'
                              },
                              totalRevenue: {
                                type: 'number'
                              },
                              averageRating: {
                                type: 'number'
                              }
                            }
                          }
                        }
                      },
                      customer: {
                        type: 'object',
                        properties: {
                          _id: {
                            type: 'string'
                          },
                          displayName: {
                            type: 'string',
                            example: 'منى سالم'
                          },
                          profileImage: {
                            type: 'string'
                          },
                          email: {
                            type: 'string'
                          },
                          phone: {
                            type: 'string'
                          },
                          stats: {
                            type: 'object',
                            properties: {
                              totalOrders: {
                                type: 'integer'
                              },
                              completedOrders: {
                                type: 'integer'
                              },
                              totalSpent: {
                                type: 'number'
                              },
                              averageRating: {
                                type: 'number'
                              }
                            }
                          }
                        }
                      },
                      category: {
                        type: 'object',
                        properties: {
                          _id: {
                            type: 'string'
                          },
                          name: {
                            type: 'string'
                          },
                          nameAr: {
                            type: 'string'
                          },
                          image: {
                            type: 'string'
                          }
                        }
                      },
                      deadline: {
                        type: 'string',
                        format: 'date-time'
                      },
                      estimatedDelivery: {
                        type: 'string',
                        format: 'date-time'
                      },
                      currentProgress: {
                        type: 'number',
                        example: 100
                      },
                      usedRevisions: {
                        type: 'number',
                        example: 1
                      },
                      maxRevisions: {
                        type: 'number',
                        example: 3
                      },
                      attachments: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      deliverables: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      milestones: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      revisions: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      specifications: {
                        type: 'object'
                      },
                      communicationPreferences: {
                        type: 'object'
                      },
                      tags: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      },
                      response: {
                        type: 'string'
                      },
                      finalNote: {
                        type: 'string'
                      },
                      createdAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      acceptedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      startedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      completedAt: {
                        type: 'string',
                        format: 'date-time'
                      },
                      cancelledAt: {
                        type: 'string',
                        format: 'date-time'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'معرف الطلب غير صالح',
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
                    example: 'معرف الطلب غير صالح'
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
        },
        404: {
          description: 'الطلب غير موجود',
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
                    example: 'الطلب غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    },
    patch: {
      tags: ['Order Management'],
      summary: 'تحديث حالة الطلب',
      description: 'تحديث حالة الطلب مع إرسال إشعارات للمستخدمين',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الطلب'
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
                  enum: ['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'],
                  description: 'الحالة الجديدة للطلب'
                },
                reason: {
                  type: 'string',
                  description: 'سبب التغيير (اختياري)'
                },
                estimatedDelivery: {
                  type: 'string',
                  format: 'date-time',
                  description: 'تاريخ التسليم المتوقع (اختياري)'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث حالة الطلب بنجاح',
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
                    example: 'تم تحديث حالة الطلب بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      status: {
                        type: 'object',
                        properties: {
                          value: {
                            type: 'string',
                            example: 'completed'
                          },
                          label: {
                            type: 'string',
                            example: 'مكتمل'
                          },
                          color: {
                            type: 'string',
                            example: '#4CAF50'
                          }
                        }
                      },
                      updatedAt: {
                        type: 'string',
                        format: 'date-time'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'بيانات غير صالحة',
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
                    example: 'حالة الطلب غير صالحة'
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
        },
        404: {
          description: 'الطلب غير موجود',
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
                    example: 'الطلب غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Order Management'],
      summary: 'حذف طلب',
      description: 'حذف طلب (حذف ناعم)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الطلب'
        }
      ],
      responses: {
        200: {
          description: 'تم حذف الطلب بنجاح',
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
                    example: 'تم حذف الطلب بنجاح'
                  },
                  data: {
                    type: 'null'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'معرف الطلب غير صالح',
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
                    example: 'معرف الطلب غير صالح'
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
        },
        404: {
          description: 'الطلب غير موجود',
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
                    example: 'الطلب غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/orders/statistics': {
    get: {
      tags: ['Order Management'],
      summary: 'جلب إحصائيات الطلبات',
      description: 'جلب إحصائيات شاملة للطلبات مع تحليل الحالات والفنانين',
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
          description: 'تم جلب إحصائيات الطلبات بنجاح',
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
                    example: 'تم جلب إحصائيات الطلبات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      totalOrders: {
                        type: 'integer',
                        example: 150
                      },
                      totalRevenue: {
                        type: 'number',
                        example: 125000
                      },
                      statusBreakdown: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            status: {
                              type: 'string',
                              example: 'completed'
                            },
                            label: {
                              type: 'string',
                              example: 'مكتمل'
                            },
                            count: {
                              type: 'integer',
                              example: 85
                            },
                            revenue: {
                              type: 'number',
                              example: 75000
                            }
                          }
                        }
                      },
                      topArtists: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            artistId: {
                              type: 'string'
                            },
                            artistName: {
                              type: 'string',
                              example: 'أحمد محمد'
                            },
                            orderCount: {
                              type: 'integer',
                              example: 25
                            },
                            revenue: {
                              type: 'number',
                              example: 15000
                            }
                          }
                        }
                      },
                      weeklyTrend: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            week: {
                              type: 'string',
                              example: '2025-W3'
                            },
                            orderCount: {
                              type: 'integer',
                              example: 12
                            },
                            revenue: {
                              type: 'number',
                              example: 8500
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
  }
}; 