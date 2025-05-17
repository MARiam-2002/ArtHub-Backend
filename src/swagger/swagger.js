
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for JSON file first
let swaggerDocument;
try {
  const jsonPath = join(__dirname, 'swagger.json');
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  swaggerDocument = JSON.parse(jsonContent);
  console.log('Using swagger.json file for documentation');
} catch (error) {
  console.log('Using JSDoc for Swagger documentation generation');
  
  // Configure swagger-jsdoc
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'ArtHub API',
        version: '1.0.0',
        description: 'Complete API documentation for ArtHub backend services',
        contact: {
          name: 'ArtHub Support',
          email: 'support@arthub.com'
        }
      },
      servers: [
        {
          url: 'https://art-hub-backend.vercel.app/api',
          description: 'Production API server',
        },
        {
          url: '/api',
          description: 'Development API server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from login or registration'
          },
          FirebaseAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Firebase ID token obtained from Firebase Authentication'
          }
        },
        responses: {
          UnauthorizedError: {
            description: 'Access token is missing or invalid',
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
                      example: 'يجب تسجيل الدخول أولاً'
                    }
                  }
                }
              }
            }
          },
          NotFoundError: {
            description: 'The specified resource was not found',
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
                      example: 'العنصر غير موجود'
                    }
                  }
                }
              }
            }
          },
          ValidationError: {
            description: 'Validation error occurred',
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
                      example: 'خطأ في البيانات المدخلة'
                    },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: {
                            type: 'string'
                          },
                          message: {
                            type: 'string'
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
      tags: [
        {
          name: 'Authentication',
          description: 'Authentication and user management endpoints'
        },
        {
          name: 'User',
          description: 'User profile, wishlist, and following management'
        },
        {
          name: 'Artwork',
          description: 'Artwork management endpoints'
        },
        {
          name: 'Image',
          description: 'Image upload and management'
        },
        {
          name: 'Chat',
          description: 'Chat and messaging functionality'
        },
        {
          name: 'Home',
          description: 'Home page data'
        },
        {
          name: 'Categories',
          description: 'Categories management'
        },
        {
          name: 'Reviews',
          description: 'Reviews and ratings'
        }
      ]
    },
    apis: [
      './src/modules/*/*.router.js', 
      './src/modules/*/*/*.js',
      './DB/models/*.js'
    ],
  };
  
  swaggerDocument = swaggerJsdoc(options);
}

// Custom options for swagger UI
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ArtHub API Documentation',
  customfavIcon: '/favicon.ico',
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none', // 'list', 'full' or 'none'
    filter: true,
    defaultModelsExpandDepth: 1,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    syntaxHighlight: {
      activate: true,
      theme: "agate"
    }
  }
};

export default [
  swaggerUi.serve, 
  swaggerUi.setup(swaggerDocument, swaggerOptions)
];
