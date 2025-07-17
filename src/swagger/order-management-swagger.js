/**
 * Order Management Swagger Documentation
 * إدارة الطلبات - توثيق API
 */

export const orderManagementPaths = {
  '/api/admin/orders': {
    get: {
      tags: ['Order Management'],
      summary: 'جلب جميع الطلبات',
      description: 'جلب قائمة الطلبات مع pagination فقط (بدون فلترة أو بحث)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'رقم الصفحة'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 20
          },
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
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب الطلبات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      orders: {
                        type: 'array',
                        items: {
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
                              example: 'وصف الطلب'
                            },
                            price: {
                              type: 'number',
                              example: 850
                            },
                            status: {
                              type: 'string',
                              example: 'completed'
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
                                }
                              }
                            },
                            sender: {
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
                                }
                              }
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z'
                            },
                            updatedAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'integer',
                            example: 1
                          },
                          limit: {
                            type: 'integer',
                            example: 20
                          },
                          total: {
                            type: 'integer',
                            example: 150
                          },
                          pages: {
                            type: 'integer',
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

  '/api/admin/orders/{id}/status': {
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
                        format: 'date-time',
                        example: '2025-01-18T10:30:00.000Z'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'بيانات غير صحيحة',
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
                    example: 'بيانات غير صحيحة'
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
  }
}; 