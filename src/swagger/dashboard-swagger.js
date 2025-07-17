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
                                example: 447392
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
  }
}; 
