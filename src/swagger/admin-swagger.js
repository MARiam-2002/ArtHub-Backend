/**
 * Admin Swagger Documentation
 * توثيق واجهات API لإدارة المشرفين
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
      description: 'إنشاء مستخدم أدمن جديد (السوبر أدمن فقط)',
      security: [{ BearerAuth: [] }],
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
                    example: 'البريد الإلكتروني مستخدم بالفعل'
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
      description: 'تحديث معلومات الأدمن (السوبر أدمن فقط)',
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
              properties: {
                displayName: {
                  type: 'string',
                  description: 'اسم العرض'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'banned'],
                  description: 'حالة الحساب'
                },
                isActive: {
                  type: 'boolean',
                  description: 'هل الحساب نشط'
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'superadmin'],
                  description: 'نوع الأدمن'
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
  }
}; 