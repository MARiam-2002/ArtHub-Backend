/**
 * Admin Swagger Documentation
 * توثيق واجهات API لإدارة المشرفين
 */

export const adminPaths = {
  '/api/v1/admin/login': {
    post: {
      tags: ['Admin'],
      summary: 'تسجيل دخول المشرف',
      description: 'تسجيل دخول المشرف أو المشرف الأعلى',
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
                  description: 'البريد الإلكتروني للمشرف',
                  example: 'admin@arthub.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  description: 'كلمة المرور',
                  example: 'Admin123!'
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
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin logged in successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'admin@arthub.com' },
                          displayName: { type: 'string', example: 'المشرف الرئيسي' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                          isActive: { type: 'boolean', example: true },
                          lastLogin: { type: 'string', format: 'date-time' }
                        }
                      },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      refreshToken: { type: 'string', example: 'refresh_token_here' }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'بيانات غير صالحة' },
        401: { description: 'بيانات تسجيل الدخول غير صحيحة' },
        403: { description: 'الحساب غير نشط أو محظور' }
      }
    }
  },

  '/api/v1/admin/profile': {
    get: {
      tags: ['Admin'],
      summary: 'الملف الشخصي للمشرف',
      description: 'جلب الملف الشخصي للمشرف الحالي',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'تم جلب الملف الشخصي بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin profile fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'admin@arthub.com' },
                          displayName: { type: 'string', example: 'المشرف الرئيسي' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                          isActive: { type: 'boolean', example: true },
                          createdAt: { type: 'string', format: 'date-time' },
                          lastLogin: { type: 'string', format: 'date-time' }
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
        403: { description: 'غير مصرح - صلاحيات مشرف مطلوبة' }
      }
    }
  },

  '/api/v1/admin/profile': {
    patch: {
      tags: ['Admin'],
      summary: 'تحديث الملف الشخصي',
      description: 'تحديث الملف الشخصي للمشرف الحالي',
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
                  minLength: 2,
                  maxLength: 50,
                  description: 'اسم العرض الجديد'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني الجديد'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث الملف الشخصي بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin profile updated successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'admin@arthub.com' },
                          displayName: { type: 'string', example: 'المشرف الرئيسي' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                          isActive: { type: 'boolean', example: true },
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
        400: { description: 'بيانات غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف مطلوبة' },
        409: { description: 'البريد الإلكتروني مستخدم بالفعل' }
      }
    }
  },

  '/api/v1/admin/change-password': {
    patch: {
      tags: ['Admin'],
      summary: 'تغيير كلمة المرور',
      description: 'تغيير كلمة مرور المشرف الحالي',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword', 'confirmPassword'],
              properties: {
                currentPassword: {
                  type: 'string',
                  format: 'password',
                  description: 'كلمة المرور الحالية'
                },
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور الجديدة (8 أحرف على الأقل)'
                },
                confirmPassword: {
                  type: 'string',
                  format: 'password',
                  description: 'تأكيد كلمة المرور الجديدة'
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
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Password changed successfully.' }
                }
              }
            }
          }
        },
        400: { description: 'بيانات غير صالحة أو كلمة المرور الحالية غير صحيحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف مطلوبة' }
      }
    }
  },

  '/api/v1/admin/admins': {
    get: {
      tags: ['Admin'],
      summary: 'قائمة المشرفين',
      description: 'جلب قائمة جميع المشرفين (للمشرف الأعلى فقط)',
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
            enum: ['admin', 'superadmin']
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'تصفية حسب الحالة',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'inactive']
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب قائمة المشرفين بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admins fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admins: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            email: { type: 'string', example: 'admin@arthub.com' },
                            displayName: { type: 'string', example: 'المشرف الرئيسي' },
                            role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                            isActive: { type: 'boolean', example: true },
                            createdAt: { type: 'string', format: 'date-time' },
                            lastLogin: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          currentPage: { type: 'integer', example: 1 },
                          totalPages: { type: 'integer', example: 1 },
                          totalAdmins: { type: 'integer', example: 3 },
                          hasNextPage: { type: 'boolean', example: false },
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
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' }
      }
    }
  },

  '/api/v1/admin/admins': {
    post: {
      tags: ['Admin'],
      summary: 'إضافة مشرف جديد',
      description: 'إضافة مشرف جديد (للمشرف الأعلى فقط)',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'displayName', 'role'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني للمشرف الجديد',
                  example: 'newadmin@arthub.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور (8 أحرف على الأقل)',
                  example: 'Admin123!'
                },
                displayName: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 50,
                  description: 'اسم العرض للمشرف',
                  example: 'مشرف جديد'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'superadmin'],
                  description: 'دور المشرف',
                  example: 'admin'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'تم إضافة المشرف بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin created successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'newadmin@arthub.com' },
                          displayName: { type: 'string', example: 'مشرف جديد' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'admin' },
                          isActive: { type: 'boolean', example: true },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: { description: 'بيانات غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' },
        409: { description: 'البريد الإلكتروني مستخدم بالفعل' }
      }
    }
  },

  '/api/v1/admin/admins/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'تفاصيل المشرف',
      description: 'جلب تفاصيل مشرف محدد (للمشرف الأعلى فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المشرف',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم جلب تفاصيل المشرف بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin details fetched successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'admin@arthub.com' },
                          displayName: { type: 'string', example: 'المشرف الرئيسي' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                          isActive: { type: 'boolean', example: true },
                          createdAt: { type: 'string', format: 'date-time' },
                          lastLogin: { type: 'string', format: 'date-time' },
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
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' },
        404: { description: 'المشرف غير موجود' }
      }
    }
  },

  '/api/v1/admin/admins/{id}': {
    patch: {
      tags: ['Admin'],
      summary: 'تحديث المشرف',
      description: 'تحديث بيانات مشرف محدد (للمشرف الأعلى فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المشرف',
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
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'البريد الإلكتروني الجديد'
                },
                displayName: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 50,
                  description: 'اسم العرض الجديد'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'superadmin'],
                  description: 'الدور الجديد'
                },
                isActive: {
                  type: 'boolean',
                  description: 'حالة النشاط'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'تم تحديث المشرف بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin updated successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      admin: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          email: { type: 'string', example: 'admin@arthub.com' },
                          displayName: { type: 'string', example: 'المشرف الرئيسي' },
                          role: { type: 'string', enum: ['admin', 'superadmin'], example: 'superadmin' },
                          isActive: { type: 'boolean', example: true },
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
        400: { description: 'بيانات غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' },
        404: { description: 'المشرف غير موجود' },
        409: { description: 'البريد الإلكتروني مستخدم بالفعل' }
      }
    }
  },

  '/api/v1/admin/admins/{id}': {
    delete: {
      tags: ['Admin'],
      summary: 'حذف المشرف',
      description: 'حذف مشرف محدد (للمشرف الأعلى فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المشرف',
          schema: {
            type: 'string',
            pattern: '^[0-9a-fA-F]{24}$'
          }
        }
      ],
      responses: {
        200: {
          description: 'تم حذف المشرف بنجاح',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin deleted successfully.' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' },
        404: { description: 'المشرف غير موجود' },
        409: { description: 'لا يمكن حذف المشرف الأعلى الوحيد' }
      }
    }
  },

  '/api/v1/admin/admins/{id}/change-password': {
    patch: {
      tags: ['Admin'],
      summary: 'تغيير كلمة مرور المشرف',
      description: 'تغيير كلمة مرور مشرف محدد (للمشرف الأعلى فقط)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'معرف المشرف',
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
              required: ['newPassword', 'confirmPassword'],
              properties: {
                newPassword: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'كلمة المرور الجديدة (8 أحرف على الأقل)',
                  example: 'NewAdmin123!'
                },
                confirmPassword: {
                  type: 'string',
                  format: 'password',
                  description: 'تأكيد كلمة المرور الجديدة',
                  example: 'NewAdmin123!'
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
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin password changed successfully.' }
                }
              }
            }
          }
        },
        400: { description: 'بيانات غير صالحة' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { description: 'غير مصرح - صلاحيات مشرف أعلى مطلوبة' },
        404: { description: 'المشرف غير موجود' }
      }
    }
  }
}; 