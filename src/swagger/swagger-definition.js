module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'ArtHub API',
    description: 'API documentation for ArtHub backend services',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
      description: 'Main API server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication and user management endpoints',
    },
    {
      name: 'Artwork',
      description: 'Artwork management endpoints',
    },
    {
      name: 'Image',
      description: 'Image upload and management',
    },
    {
      name: 'Chat',
      description: 'Chat and messaging functionality',
    },
    {
      name: 'Home',
      description: 'Home page data',
    },
    {
      name: 'Special Requests',
      description: 'Special commission request management',
    },
    {
      name: 'Reports',
      description: 'Content reporting system',
    },
    {
      name: 'Transactions',
      description: 'Financial transactions and payments',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}; 