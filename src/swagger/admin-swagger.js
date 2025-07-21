/**
 * Admin Swagger Documentation
 * لوحة التحكم الإدارية - إدارة المستخدمين والأدمن
 */

export const adminPaths = {
  '/api/admin/login': {
    post: {
      tags: ['Admin'],
      summary: 'تسجيل دخول الأدمن',
      description: 'تسجيل دخول للأدمن والسوبر أدمن',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني',
                  example: 'admin@example.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  description: 'كلمة المرور',
                  example: 'Password123!'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تسجيل الدخول بنجاح',
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
                    example: 'تم تسجيل الدخول بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      token: {
                        type: 'string',
                        description: 'رمز الوصول'
                      },
                      refreshToken: {
                        type: 'string',
                        description: 'رمز التحديث'
                      },
                      admin: {
                        type: 'object',
                        properties: {
                          _id: {
                            type: 'string'
                          },
                          email: {
                            type: 'string'
                          },
                          displayName: {
                            type: 'string'
                          },
                          role: {
                            type: 'string',
                            enum: ['admin', 'superadmin']
                          },
                          isActive: {
                            type: 'boolean'
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
                    example: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/profile': {
    get: {
      tags: ['Admin'],
      summary: 'جلب ملف الأدمن',
      description: 'جلب معلومات ملف الأدمن الحالي',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب الملف بنجاح',
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
                    example: 'تم جلب الملف بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string'
                      },
                      email: {
                        type: 'string'
                      },
                      displayName: {
                        type: 'string'
                      },
                      role: {
                        type: 'string',
                        enum: ['admin', 'superadmin']
                      },
                      isActive: {
                        type: 'boolean'
                      },
                      createdAt: {
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
        }
      }
    },
    put: {
      tags: ['Admin'],
      summary: 'تحديث ملف الأدمن',
      description: 'تحديث معلومات ملف الأدمن الحالي',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                displayName: {
                  type: 'string',
                  description: 'اسم العرض',
                  example: 'أحمد محمد'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني',
                  example: 'admin@example.com'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث الملف بنجاح',
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
                    example: 'تم تحديث الملف بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string'
                      },
                      email: {
                        type: 'string'
                      },
                      displayName: {
                        type: 'string'
                      },
                      role: {
                        type: 'string'
                      },
                      isActive: {
                        type: 'boolean'
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
        }
      }
    }
  },

  '/api/admin/change-password': {
    put: {
      tags: ['Admin'],
      summary: 'تغيير كلمة المرور',
      description: 'تغيير كلمة مرور الأدمن الحالي',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  format: 'password',
                  description: 'كلمة المرور الحالية',
                  example: 'OldPassword123!'
                },
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور الجديدة',
                  example: 'NewPassword123!'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تغيير كلمة المرور بنجاح',
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
                    example: 'تم تغيير كلمة المرور بنجاح'
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
                    example: 'كلمة المرور الحالية غير صحيحة'
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
        }
      }
    }
  },

  '/api/admin/admins': {
    get: {
      tags: ['Admin'],
      summary: 'جلب جميع الأدمن',
      description: 'جلب قائمة جميع المستخدمين الأدمن (السوبر أدمن فقط)',
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
            default: 10
          },
          description: 'عدد العناصر في الصفحة'
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'بحث في الاسم أو البريد الإلكتروني'
        },
        {
          in: 'query',
          name: 'role',
          schema: {
            type: 'string',
            enum: ['admin', 'superadmin']
          },
          description: 'نوع الأدمن'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب الأدمن بنجاح',
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
                    example: 'تم جلب الأدمن بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      admins: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: {
                              type: 'string'
                            },
                            email: {
                              type: 'string'
                            },
                            displayName: {
                              type: 'string'
                            },
                            role: {
                              type: 'string',
                              enum: ['admin', 'superadmin']
                            },
                            isActive: {
                              type: 'boolean'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          currentPage: {
                            type: 'integer'
                          },
                          totalPages: {
                            type: 'integer'
                          },
                          totalItems: {
                            type: 'integer'
                          },
                          hasNextPage: {
                            type: 'boolean'
                          },
                          hasPrevPage: {
                            type: 'boolean'
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
          description: 'ممنوع - السوبر أدمن فقط',
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
    },
    post: {
      tags: ['Admin'],
      summary: 'إنشاء أدمن جديد',
      description: 'إنشاء مستخدم أدمن جديد مع رفع صورة اختيارية (السوبر أدمن فقط)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني',
                  example: 'newadmin@example.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور',
                  example: 'Password123!'
                },
                displayName: {
                  type: 'string',
                  description: 'اسم العرض',
                  example: 'أحمد محمد'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'superadmin'],
                  default: 'admin',
                  description: 'نوع الأدمن'
                },
                profileImage: {
                  type: 'string',
                  format: 'binary',
                  description: 'صورة الملف الشخصي (JPEG, PNG) - اختياري'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'تم إنشاء الأدمن بنجاح',
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
                    example: 'تم إنشاء الأدمن بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      email: {
                        type: 'string',
                        example: 'newadmin@example.com'
                      },
                      displayName: {
                        type: 'string',
                        example: 'أحمد محمد'
                      },
                      role: {
                        type: 'string',
                        example: 'admin'
                      },
                      profileImage: {
                        type: 'object',
                        properties: {
                          url: {
                            type: 'string',
                            example: 'https://res.cloudinary.com/example/image/upload/v1234567890/admin-profile.jpg'
                          },
                          id: {
                            type: 'string',
                            example: 'arthub/admin-profiles/admin_1234567890_abc123'
                          }
                        }
                      },
                      createdAt: {
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
          description: 'بيانات غير صحيحة أو فشل في رفع الصورة',
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
                    example: 'البريد الإلكتروني مستخدم بالفعل أو فشل في رفع الصورة'
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
          description: 'ممنوع - السوبر أدمن فقط',
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

  '/api/admin/admins/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'تحديث الأدمن',
      description: 'تحديث معلومات الأدمن مع دعم رفع ملف الصورة وتغيير كلمة المرور (السوبر أدمن فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الأدمن'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                displayName: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 50,
                  description: 'اسم العرض',
                  example: 'أحمد محمد'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني',
                  example: 'ahmed@example.com'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'superadmin'],
                  description: 'نوع الأدمن',
                  example: 'admin'
                },
                isActive: {
                  type: 'boolean',
                  description: 'هل الحساب نشط',
                  example: true
                },
                profileImage: {
                  type: 'string',
                  format: 'binary',
                  description: 'صورة الملف الشخصي (JPEG, PNG)',
                  example: 'image file'
                },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: 'كلمة المرور الجديدة (سيتم تشفيرها تلقائياً)',
                  example: 'NewPassword123!'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث الأدمن بنجاح',
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
                    example: 'تم تحديث الأدمن بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      email: {
                        type: 'string',
                        example: 'ahmed@example.com'
                      },
                      displayName: {
                        type: 'string',
                        example: 'أحمد محمد'
                      },
                      role: {
                        type: 'string',
                        example: 'admin'
                      },
                      isActive: {
                        type: 'boolean',
                        example: true
                      },
                      profileImage: {
                        type: 'string',
                        example: 'https://res.cloudinary.com/example/image/upload/arthub/admin-profiles/admin_507f1f77bcf86cd799439011_1234567890.jpg',
                        description: 'رابط صورة الملف الشخصي على Cloudinary'
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
          description: 'ممنوع - السوبر أدمن فقط',
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
          description: 'الأدمن غير موجود',
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
                    example: 'الأدمن غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Admin'],
      summary: 'حذف الأدمن',
      description: 'حذف الأدمن (السوبر أدمن فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الأدمن'
        }
      ],
      responses: {
        200: {
          description: 'تم حذف الأدمن بنجاح',
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
                    example: 'تم حذف الأدمن بنجاح'
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
                    example: 'لا يمكن حذف السوبر أدمن'
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
          description: 'ممنوع - السوبر أدمن فقط',
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
          description: 'الأدمن غير موجود',
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
                    example: 'الأدمن غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/admins/{id}/change-password': {
    put: {
      tags: ['Admin'],
      summary: 'تغيير كلمة مرور الأدمن',
      description: 'تغيير كلمة مرور الأدمن (السوبر أدمن فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف الأدمن'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newPassword'],
              properties: {
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور الجديدة',
                  example: 'NewPassword123!'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تغيير كلمة المرور بنجاح',
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
                    example: 'تم تغيير كلمة المرور بنجاح'
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
                    example: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
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
          description: 'ممنوع - السوبر أدمن فقط',
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
          description: 'الأدمن غير موجود',
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
                    example: 'الأدمن غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'جلب جميع المستخدمين',
      description: 'جلب جميع المستخدمين مع الباجينيشن - 10 مستخدمين في الصفحة افتراضياً',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          },
          description: 'رقم الصفحة',
          example: 1
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          description: 'عدد المستخدمين في الصفحة',
          example: 10
        }
      ],
      responses: {
        200: {
          description: 'تم جلب المستخدمين بنجاح',
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
                    example: 'تم جلب قائمة المستخدمين بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
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
                              example: 'عمر خالد محمد'
                            },
                            email: {
                              type: 'string',
                              example: 'omar.2004@gmail.com'
                            },
                            phoneNumber: {
                              type: 'string',
                              example: '+201140067845'
                            },
                            role: {
                              type: 'string',
                              enum: ['user', 'artist'],
                              example: 'user'
                            },
                            isActive: {
                              type: 'boolean',
                              example: true
                            },
                            isVerified: {
                              type: 'boolean',
                              example: true
                            },
                            profileImage: {
                              type: 'object',
                              properties: {
                                url: {
                                  type: 'string',
                                  example: 'https://example.com/profile.jpg'
                                },
                                id: {
                                  type: 'string',
                                  example: 'profile_id'
                                }
                              }
                            },
                            lastActive: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2023-01-15T10:30:00.000Z'
                            },
                            job: {
                              type: 'string',
                              example: 'طالب'
                            },
                            location: {
                              type: 'string',
                              example: 'القاهرة, مصر'
                            },
                            bio: {
                              type: 'string',
                              example: 'مستخدم نشط'
                            }
                          }
                        }
                      },
                      statistics: {
                        type: 'object',
                        properties: {
                          totalUsers: {
                            type: 'integer',
                            example: 150
                          },
                          activeUsers: {
                            type: 'integer',
                            example: 120
                          },
                          bannedUsers: {
                            type: 'integer',
                            example: 5
                          },
                          clients: {
                            type: 'integer',
                            example: 100
                          },
                          artists: {
                            type: 'integer',
                            example: 50
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
                            example: 10
                          },
                          total: {
                            type: 'integer',
                            example: 150
                          },
                          pages: {
                            type: 'integer',
                            example: 15
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
          description: 'ممنوع - الأدمن فقط',
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

  '/api/admin/users/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'جلب تفاصيل المستخدم',
      description: 'جلب معلومات مفصلة عن مستخدم محدد',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
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
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم جلب تفاصيل المستخدم بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string'
                      },
                      displayName: {
                        type: 'string'
                      },
                      email: {
                        type: 'string'
                      },
                      role: {
                        type: 'string',
                        enum: ['user', 'artist']
                      },
                      isActive: {
                        type: 'boolean'
                      },
                      createdAt: {
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/{id}/block': {
    patch: {
      tags: ['Admin'],
      summary: 'حظر/إلغاء حظر المستخدم',
      description: 'حظر أو إلغاء حظر حساب المستخدم',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
        }
      ],
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
                  enum: ['block', 'unblock'],
                  description: 'الإجراء المطلوب'
                },
                reason: {
                  type: 'string',
                  description: 'سبب الحظر (اختياري)'
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
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'تم تحديث حالة المستخدم بنجاح'
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/{id}/send-message': {
    post: {
      tags: ['Admin'],
      summary: 'إرسال رسالة للمستخدم',
      description: 'إرسال رسالة إلى مستخدم محدد (بالبريد الإلكتروني أو المحادثة)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['subject', 'message', 'deliveryMethod'],
              properties: {
                subject: {
                  type: 'string',
                  description: 'موضوع الرسالة'
                },
                message: {
                  type: 'string',
                  description: 'محتوى الرسالة'
                },
                deliveryMethod: {
                  type: 'string',
                  enum: ['email', 'chat', 'both'],
                  description: 'طريقة التوصيل'
                },
                attachments: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'روابط الملفات المرفقة'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم إرسال الرسالة بنجاح',
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
                    example: 'تم إرسال الرسالة بنجاح'
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/{id}/orders': {
    get: {
      tags: ['Admin'],
      summary: 'جلب طلبات المستخدم',
      description: 'جلب جميع طلبات مستخدم محدد',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
        },
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
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
          },
          description: 'تصفية حسب حالة الطلب'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            enum: ['createdAt', 'updatedAt', 'price'],
            default: 'createdAt'
          },
          description: 'حقل الترتيب'
        },
        {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          description: 'ترتيب النتائج'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب طلبات المستخدم بنجاح',
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
                    example: 'تم جلب طلبات المستخدم بنجاح'
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
                              type: 'string'
                            },
                            status: {
                              type: 'string'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'integer'
                          },
                          limit: {
                            type: 'integer'
                          },
                          total: {
                            type: 'integer'
                          },
                          pages: {
                            type: 'integer'
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/{id}/reviews': {
    get: {
      tags: ['Admin'],
      summary: 'جلب تقييمات المستخدم',
      description: 'جلب جميع تقييمات مستخدم محدد',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
        },
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
        },
        {
          in: 'query',
          name: 'rating',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 5
          },
          description: 'تصفية حسب التقييم'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            enum: ['createdAt', 'rating'],
            default: 'createdAt'
          },
          description: 'حقل الترتيب'
        },
        {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          description: 'ترتيب النتائج'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تقييمات المستخدم بنجاح',
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
                    example: 'تم جلب تقييمات المستخدم بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: {
                              type: 'string'
                            },
                            rating: {
                              type: 'integer'
                            },
                            comment: {
                              type: 'string'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'integer'
                          },
                          limit: {
                            type: 'integer'
                          },
                          total: {
                            type: 'integer'
                          },
                          pages: {
                            type: 'integer'
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/{id}/activity': {
    get: {
      tags: ['Admin'],
      summary: 'جلب نشاط المستخدم',
      description: 'جلب سجل النشاط لمستخدم محدد',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف المستخدم'
        },
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
        },
        {
          in: 'query',
          name: 'activityType',
          schema: {
            type: 'string',
            enum: ['login', 'order', 'review', 'profile_update', 'artwork_view']
          },
          description: 'تصفية حسب نوع النشاط'
        },
        {
          in: 'query',
          name: 'dateFrom',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'تاريخ البداية'
        },
        {
          in: 'query',
          name: 'dateTo',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'تاريخ النهاية'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب نشاط المستخدم بنجاح',
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
                    example: 'تم جلب نشاط المستخدم بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      activities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: {
                              type: 'string'
                            },
                            type: {
                              type: 'string'
                            },
                            description: {
                              type: 'string'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'integer'
                          },
                          limit: {
                            type: 'integer'
                          },
                          total: {
                            type: 'integer'
                          },
                          pages: {
                            type: 'integer'
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
          description: 'ممنوع - الأدمن فقط',
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
          description: 'المستخدم غير موجود',
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
                    example: 'المستخدم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/users/export': {
    get: {
      tags: ['Admin'],
      summary: 'تصدير بيانات المستخدمين',
      description: 'تصدير جميع بيانات المستخدمين بصيغة Excel جميلة مع ألوان التطبيق',
      security: [{ BearerAuth: [] }],
      parameters: [],
      responses: {
        200: {
          description: 'تم تصدير البيانات بنجاح',
          content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
              schema: {
                type: 'string',
                format: 'binary'
              },
              description: 'ملف Excel جميل مع ألوان التطبيق وإحصائيات'
            },
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
                    example: 'تم تصدير بيانات المستخدمين بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
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
                              example: 'عمر خالد محمد'
                            },
                            email: {
                              type: 'string',
                              example: 'omar.2004@gmail.com'
                            },
                            phoneNumber: {
                              type: 'string',
                              example: '+201140067845'
                            },
                            role: {
                              type: 'string',
                              example: 'user'
                            },
                            isActive: {
                              type: 'boolean',
                              example: true
                            },
                            isVerified: {
                              type: 'boolean',
                              example: true
                            },
                            job: {
                              type: 'string',
                              example: 'طالب'
                            },
                            location: {
                              type: 'string',
                              example: 'القاهرة, مصر'
                            },
                            bio: {
                              type: 'string',
                              example: 'مستخدم نشط'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time'
                            },
                            lastActive: {
                              type: 'string',
                              format: 'date-time'
                            }
                          }
                        }
                      },
                      statistics: {
                        type: 'object',
                        properties: {
                          totalUsers: {
                            type: 'integer',
                            example: 150
                          },
                          activeUsers: {
                            type: 'integer',
                            example: 120
                          },
                          inactiveUsers: {
                            type: 'integer',
                            example: 5
                          },
                          artists: {
                            type: 'integer',
                            example: 50
                          },
                          clients: {
                            type: 'integer',
                            example: 100
                          },
                          verifiedUsers: {
                            type: 'integer',
                            example: 140
                          },
                          unverifiedUsers: {
                            type: 'integer',
                            example: 10
                          }
                        }
                      },
                      exportInfo: {
                        type: 'object',
                        properties: {
                          format: {
                            type: 'string',
                            example: 'json'
                          },
                          totalUsers: {
                            type: 'integer',
                            example: 150
                          },
                          exportedAt: {
                            type: 'string',
                            format: 'date-time'
                          },
                          filters: {
                            type: 'object',
                            properties: {
                              role: {
                                type: 'string',
                                example: 'artist'
                              },
                              status: {
                                type: 'string',
                                example: 'active'
                              },
                              dateFrom: {
                                type: 'string',
                                example: '2023-01-01'
                              },
                              dateTo: {
                                type: 'string',
                                example: '2025-01-18'
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
          description: 'ممنوع - الأدمن فقط',
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
        500: {
          description: 'خطأ في إنشاء ملف Excel',
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
                    example: 'فشل في إنشاء ملف Excel'
                  },
                  error: {
                    type: 'string',
                    example: 'Error details'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // Reviews Management Paths
  '/api/admin/reviews': {
    get: {
      tags: ['Reviews Management'],
      summary: 'جلب تقييمات الأعمال الفنية',
      description: 'جلب قائمة تقييمات الأعمال الفنية (اللوحات) فقط مع التفاصيل الأساسية للعرض في الجدول. يتم الترتيب والتصفية من الفرونت.',
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
          description: 'تم جلب التقييمات بنجاح',
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
                    example: 'تم جلب التقييمات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      reviews: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'number',
                              example: 1,
                              description: 'الرقم التسلسلي'
                            },
                            _id: {
                              type: 'string',
                              example: '507f1f77bcf86cd799439011',
                              description: 'معرف التقييم'
                            },
                            artworkTitle: {
                              type: 'string',
                              example: 'لوحة زيتية مخصصة',
                              description: 'اسم العمل الفني'
                            },
                            clientName: {
                              type: 'string',
                              example: 'منى سالم',
                              description: 'اسم العميل'
                            },
                            clientEmail: {
                              type: 'string',
                              example: 'mona.salem@example.com',
                              description: 'بريد العميل'
                            },
                            artistName: {
                              type: 'string',
                              example: 'أحمد محمد',
                              description: 'اسم الفنان'
                            },
                            artistEmail: {
                              type: 'string',
                              example: 'ahmed.mohamed@example.com',
                              description: 'بريد الفنان'
                            },
                            rating: {
                              type: 'number',
                              example: 4,
                              description: 'التقييم (1-5)'
                            },
                            comment: {
                              type: 'string',
                              example: 'عمل رائع ومميز',
                              description: 'التعليق'
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z',
                              description: 'تاريخ التقييم'
                            },
                            updatedAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z',
                              description: 'تاريخ آخر تحديث'
                            },
                            artworkImage: {
                              type: 'string',
                              example: 'https://example.com/artwork.jpg',
                              description: 'صورة العمل الفني'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'number',
                            example: 1
                          },
                          limit: {
                            type: 'number',
                            example: 20
                          },
                          total: {
                            type: 'number',
                            example: 150
                          },
                          pages: {
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

  '/api/admin/reviews/{id}': {
    get: {
      tags: ['Reviews Management'],
      summary: 'جلب تفاصيل تعليق محدد',
      description: 'جلب تفاصيل كاملة لتعليق محدد لعرضه في النافذة المنبثقة',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف التقييم'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تفاصيل التقييم بنجاح',
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
                    example: 'تم جلب تفاصيل التقييم بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      comment: {
                        type: 'string',
                        example: 'عمل رائع ومميز، الفنان متعاون جداً',
                        description: 'نص التعليق الكامل'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'معرف التقييم غير صالح',
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
                    example: 'معرف التقييم غير صالح'
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
          description: 'التقييم غير موجود',
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
                    example: 'التقييم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Reviews Management'],
      summary: 'حذف تقييم',
      description: 'حذف تقييم محدد من النظام',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف التقييم'
        }
      ],
      responses: {
        200: {
          description: 'تم حذف التقييم بنجاح',
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
                    example: 'تم حذف التقييم بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      deletedAt: {
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
          description: 'معرف التقييم غير صالح',
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
                    example: 'معرف التقييم غير صالح'
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
          description: 'التقييم غير موجود',
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
                    example: 'التقييم غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // Reports Management Paths
  '/api/admin/reports': {
    get: {
      tags: ['Reports Management'],
      summary: 'جلب جميع البلاغات',
      description: 'جلب قائمة جميع البلاغات مع التفاصيل الأساسية للعرض في الجدول. يتم الترتيب والتصفية من الفرونت.',
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
          description: 'تم جلب البلاغات بنجاح',
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
                    example: 'تم جلب البلاغات بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      reports: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'number',
                              example: 1,
                              description: 'الرقم التسلسلي'
                            },
                            _id: {
                              type: 'string',
                              example: '507f1f77bcf86cd799439011',
                              description: 'معرف البلاغ'
                            },
                            complainant: {
                              type: 'string',
                              example: 'منى سالم',
                              description: 'اسم المشتكي'
                            },
                            complainantEmail: {
                              type: 'string',
                              example: 'mona.salem@example.com',
                              description: 'بريد المشتكي'
                            },
                            artist: {
                              type: 'string',
                              example: 'أحمد محمد',
                              description: 'اسم الفنان'
                            },
                            artistEmail: {
                              type: 'string',
                              example: 'ahmed.mohamed@example.com',
                              description: 'بريد الفنان'
                            },
                            reportType: {
                              type: 'string',
                              example: 'تأخير في التسليم',
                              description: 'نوع البلاغ'
                            },
                            date: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-01-18T10:30:00.000Z',
                              description: 'تاريخ البلاغ'
                            },
                            description: {
                              type: 'string',
                              example: 'تأخر الفنان في تسليم العمل',
                              description: 'وصف البلاغ'
                            },
                            status: {
                              type: 'string',
                              example: 'pending',
                              description: 'حالة البلاغ'
                            },
                            statusText: {
                              type: 'string',
                              example: 'تحت المراجعة',
                              description: 'نص حالة البلاغ'
                            }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: {
                            type: 'number',
                            example: 1
                          },
                          limit: {
                            type: 'number',
                            example: 20
                          },
                          total: {
                            type: 'number',
                            example: 150
                          },
                          pages: {
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

  '/api/admin/reports/{id}': {
    get: {
      tags: ['Reports Management'],
      summary: 'جلب تفاصيل بلاغ محدد',
      description: 'جلب تفاصيل كاملة لبلاغ محدد لعرضه في النافذة المنبثقة',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف البلاغ'
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تفاصيل البلاغ بنجاح',
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
                    example: 'تم جلب تفاصيل البلاغ بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      description: {
                        type: 'string',
                        example: 'تأخر الفنان في تسليم العمل لمدة أسبوع كامل',
                        description: 'تفاصيل البلاغ'
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
        },
        404: {
          description: 'البلاغ غير موجود',
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
                    example: 'البلاغ غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Reports Management'],
      summary: 'حذف بلاغ',
      description: 'حذف بلاغ محدد من النظام',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'معرف البلاغ'
        }
      ],
      responses: {
        200: {
          description: 'تم حذف البلاغ بنجاح',
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
                    example: 'تم حذف البلاغ بنجاح'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '507f1f77bcf86cd799439011'
                      },
                      deletedAt: {
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
          description: 'معرف البلاغ غير صالح',
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
                    example: 'معرف البلاغ غير صالح'
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
          description: 'البلاغ غير موجود',
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
                    example: 'البلاغ غير موجود'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/admin/orders': {
    get: {
      tags: ['Order Management'],
      summary: 'جلب جميع الطلبات',
      description: 'جلب قائمة جميع الطلبات مع التصفية والترتيب والتصفح',
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
                            user: {
                              type: 'object',
                              properties: {
                                _id: {
                                  type: 'string'
                                },
                                displayName: {
                                  type: 'string',
                                  example: 'عمر خالد'
                                },
                                email: {
                                  type: 'string',
                                  example: 'omar@example.com'
                                },
                                profileImage: {
                                  type: 'string'
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
                                email: {
                                  type: 'string',
                                  example: 'ahmed@example.com'
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
  },

  '/api/admin/orders/{id}': {
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