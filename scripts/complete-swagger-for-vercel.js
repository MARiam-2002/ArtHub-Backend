/**
 * Rebuild arthub-swagger.json for complete API coverage + Vercel production servers.
 * Merges admin/dashboard path modules, fixes /api/users → /api/user, adds missing ops.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminPaths } from '../src/swagger/admin-swagger.js';
import { dashboardPaths } from '../src/swagger/dashboard-swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const swaggerPath = path.join(root, 'src', 'swagger', 'arthub-swagger.json');

const PRODUCTION_URL = process.env.API_URL || 'https://arthub-api.vercel.app';

const successResponse = {
  description: 'Successful response',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/SuccessResponse' }
    }
  }
};

const errorResponses = {
  400: {
    description: 'Bad request',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
    }
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
    }
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
    }
  },
  404: {
    description: 'Not found',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
    }
  },
  500: {
    description: 'Internal server error',
    content: {
      'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
    }
  }
};

function pathParams(openApiPath) {
  const params = [];
  const re = /\{([A-Za-z0-9_]+)\}/g;
  let m;
  while ((m = re.exec(openApiPath))) {
    params.push({
      name: m[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: `${m[1]} path parameter`
    });
  }
  return params;
}

function paginationParams() {
  return [
    {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', default: 1 },
      description: 'Page number'
    },
    {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', default: 20 },
      description: 'Items per page'
    }
  ];
}

function op({
  tags,
  summary,
  description,
  method,
  apiPath,
  auth = true,
  body = null,
  query = [],
  extraResponses = {}
}) {
  const operation = {
    tags,
    summary,
    description: description || summary,
    parameters: [...pathParams(apiPath), ...query],
    responses: {
      200: successResponse,
      ...errorResponses,
      ...extraResponses
    }
  };
  if (auth) {
    operation.security = [{ BearerAuth: [] }, { FirebaseAuth: [] }];
  }
  if (body) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: body
        }
      }
    };
  }
  return { [method]: operation };
}

/** Implemented routes not fully covered by existing JSON / admin / dashboard modules */
const missingSpecs = [
  // Auth
  {
    path: '/api/auth/fcm-token',
    ...op({
      tags: ['Authentication'],
      summary: 'Register or update FCM device token',
      method: 'post',
      apiPath: '/api/auth/fcm-token',
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'FCM device token' },
          deviceType: { type: 'string', enum: ['android', 'ios', 'web'] }
        }
      }
    })
  },

  // Artwork extras
  {
    path: '/api/artworks/featured',
    ...op({
      tags: ['Artworks'],
      summary: 'Get featured artworks',
      method: 'get',
      apiPath: '/api/artworks/featured',
      auth: false,
      query: paginationParams()
    })
  },
  {
    path: '/api/artworks/search',
    ...op({
      tags: ['Artworks'],
      summary: 'Search artworks',
      method: 'get',
      apiPath: '/api/artworks/search',
      auth: false,
      query: [
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
        ...paginationParams()
      ]
    })
  },
  {
    path: '/api/artworks/artist/{artistId}',
    ...op({
      tags: ['Artworks'],
      summary: 'Get artworks by artist',
      method: 'get',
      apiPath: '/api/artworks/artist/{artistId}',
      auth: false,
      query: paginationParams()
    })
  },
  {
    path: '/api/artworks/my-artworks',
    ...op({
      tags: ['Artworks'],
      summary: 'Get current user artworks',
      method: 'get',
      apiPath: '/api/artworks/my-artworks',
      query: paginationParams()
    })
  },
  {
    path: '/api/artworks/{id}/favorite',
    post: op({
      tags: ['Artworks'],
      summary: 'Add artwork to favorites',
      method: 'post',
      apiPath: '/api/artworks/{id}/favorite'
    }).post,
    delete: op({
      tags: ['Artworks'],
      summary: 'Remove artwork from favorites',
      method: 'delete',
      apiPath: '/api/artworks/{id}/favorite'
    }).delete
  },
  {
    path: '/api/artworks/{id}/reviews',
    get: op({
      tags: ['Artworks'],
      summary: 'Get artwork reviews',
      method: 'get',
      apiPath: '/api/artworks/{id}/reviews',
      auth: false,
      query: paginationParams()
    }).get,
    post: op({
      tags: ['Artworks'],
      summary: 'Create artwork review',
      method: 'post',
      apiPath: '/api/artworks/{id}/reviews',
      body: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        }
      }
    }).post
  },

  // Chat
  {
    path: '/api/chat/unread-counts',
    ...op({
      tags: ['Chat'],
      summary: 'Get unread message counts',
      method: 'get',
      apiPath: '/api/chat/unread-counts'
    })
  },

  // Categories
  {
    path: '/api/categories',
    get: op({
      tags: ['Categories'],
      summary: 'List categories',
      method: 'get',
      apiPath: '/api/categories',
      auth: false
    }).get,
    post: op({
      tags: ['Categories'],
      summary: 'Create category (admin)',
      method: 'post',
      apiPath: '/api/categories',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          image: { type: 'string' }
        }
      }
    }).post
  },
  {
    path: '/api/categories/popular',
    ...op({
      tags: ['Categories'],
      summary: 'Get popular categories',
      method: 'get',
      apiPath: '/api/categories/popular',
      auth: false
    })
  },
  {
    path: '/api/categories/stats',
    ...op({
      tags: ['Categories'],
      summary: 'Get category statistics',
      method: 'get',
      apiPath: '/api/categories/stats',
      auth: false
    })
  },
  {
    path: '/api/categories/{id}',
    get: op({
      tags: ['Categories'],
      summary: 'Get category by ID',
      method: 'get',
      apiPath: '/api/categories/{id}',
      auth: false
    }).get,
    put: op({
      tags: ['Categories'],
      summary: 'Update category (admin)',
      method: 'put',
      apiPath: '/api/categories/{id}',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          image: { type: 'string' }
        }
      }
    }).put,
    delete: op({
      tags: ['Categories'],
      summary: 'Delete category (admin)',
      method: 'delete',
      apiPath: '/api/categories/{id}'
    }).delete
  },

  // Follow (real routes)
  {
    path: '/api/follow/toggle',
    ...op({
      tags: ['Follow'],
      summary: 'Toggle follow status for an artist',
      method: 'post',
      apiPath: '/api/follow/toggle',
      body: {
        type: 'object',
        required: ['artistId'],
        properties: { artistId: { type: 'string' } }
      }
    })
  },
  {
    path: '/api/follow/follow',
    ...op({
      tags: ['Follow'],
      summary: 'Follow an artist',
      method: 'post',
      apiPath: '/api/follow/follow',
      body: {
        type: 'object',
        required: ['artistId'],
        properties: { artistId: { type: 'string' } }
      }
    })
  },
  {
    path: '/api/follow/unfollow',
    ...op({
      tags: ['Follow'],
      summary: 'Unfollow an artist',
      method: 'post',
      apiPath: '/api/follow/unfollow',
      body: {
        type: 'object',
        required: ['artistId'],
        properties: { artistId: { type: 'string' } }
      }
    })
  },
  {
    path: '/api/follow/followers',
    ...op({
      tags: ['Follow'],
      summary: 'Get current user followers',
      method: 'get',
      apiPath: '/api/follow/followers',
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/followers/{userId}',
    ...op({
      tags: ['Follow'],
      summary: 'Get followers of a user',
      method: 'get',
      apiPath: '/api/follow/followers/{userId}',
      auth: false,
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/following',
    ...op({
      tags: ['Follow'],
      summary: 'Get users the current user follows',
      method: 'get',
      apiPath: '/api/follow/following',
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/following/{userId}',
    ...op({
      tags: ['Follow'],
      summary: 'Get following list for a user',
      method: 'get',
      apiPath: '/api/follow/following/{userId}',
      auth: false,
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/status/{artistId}',
    ...op({
      tags: ['Follow'],
      summary: 'Check follow status for an artist',
      method: 'get',
      apiPath: '/api/follow/status/{artistId}'
    })
  },
  {
    path: '/api/follow/my-followers',
    ...op({
      tags: ['Follow'],
      summary: 'Get my followers',
      method: 'get',
      apiPath: '/api/follow/my-followers',
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/my-following',
    ...op({
      tags: ['Follow'],
      summary: 'Get my following list',
      method: 'get',
      apiPath: '/api/follow/my-following',
      query: paginationParams()
    })
  },
  {
    path: '/api/follow/artist/{artistId}',
    post: op({
      tags: ['Follow'],
      summary: 'Follow artist by ID',
      method: 'post',
      apiPath: '/api/follow/artist/{artistId}'
    }).post,
    delete: op({
      tags: ['Follow'],
      summary: 'Unfollow artist by ID',
      method: 'delete',
      apiPath: '/api/follow/artist/{artistId}'
    }).delete
  },

  // Special requests
  {
    path: '/api/special-requests/types',
    ...op({
      tags: ['Special Requests'],
      summary: 'Get special request types',
      method: 'get',
      apiPath: '/api/special-requests/types',
      auth: false
    })
  },
  {
    path: '/api/special-requests/my',
    ...op({
      tags: ['Special Requests'],
      summary: 'Get my special requests',
      method: 'get',
      apiPath: '/api/special-requests/my',
      query: paginationParams()
    })
  },
  {
    path: '/api/special-requests/artist',
    ...op({
      tags: ['Special Requests'],
      summary: 'Get special requests for artist',
      method: 'get',
      apiPath: '/api/special-requests/artist',
      query: paginationParams()
    })
  },
  {
    path: '/api/special-requests/cancellation-reasons',
    ...op({
      tags: ['Special Requests'],
      summary: 'Get cancellation reasons',
      method: 'get',
      apiPath: '/api/special-requests/cancellation-reasons',
      auth: false
    })
  },
  {
    path: '/api/special-requests/{requestId}',
    get: op({
      tags: ['Special Requests'],
      summary: 'Get special request by ID',
      method: 'get',
      apiPath: '/api/special-requests/{requestId}'
    }).get,
    delete: op({
      tags: ['Special Requests'],
      summary: 'Delete special request',
      method: 'delete',
      apiPath: '/api/special-requests/{requestId}'
    }).delete
  },
  {
    path: '/api/special-requests/{requestId}/response',
    ...op({
      tags: ['Special Requests'],
      summary: 'Respond to special request',
      method: 'post',
      apiPath: '/api/special-requests/{requestId}/response',
      body: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          price: { type: 'number' },
          status: { type: 'string' }
        }
      }
    })
  },
  {
    path: '/api/special-requests/{requestId}/complete',
    ...op({
      tags: ['Special Requests'],
      summary: 'Mark special request as complete',
      method: 'post',
      apiPath: '/api/special-requests/{requestId}/complete'
    })
  },
  {
    path: '/api/special-requests/{requestId}/cancel',
    ...op({
      tags: ['Special Requests'],
      summary: 'Cancel special request',
      method: 'post',
      apiPath: '/api/special-requests/{requestId}/cancel',
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string' }
        }
      }
    })
  },

  // Transactions
  {
    path: '/api/transactions/stats',
    ...op({
      tags: ['Transactions'],
      summary: 'Get transaction statistics',
      method: 'get',
      apiPath: '/api/transactions/stats'
    })
  },
  {
    path: '/api/transactions/export',
    ...op({
      tags: ['Transactions'],
      summary: 'Export transactions',
      method: 'get',
      apiPath: '/api/transactions/export',
      query: [
        {
          name: 'format',
          in: 'query',
          schema: { type: 'string', enum: ['xlsx', 'csv', 'pdf'], default: 'xlsx' }
        }
      ]
    })
  },
  {
    path: '/api/transactions/bulk',
    ...op({
      tags: ['Transactions'],
      summary: 'Bulk update transactions',
      method: 'patch',
      apiPath: '/api/transactions/bulk',
      body: {
        type: 'object',
        required: ['ids', 'status'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' }
        }
      }
    })
  },
  {
    path: '/api/transactions/{transactionId}',
    ...op({
      tags: ['Transactions'],
      summary: 'Get transaction by ID',
      method: 'get',
      apiPath: '/api/transactions/{transactionId}'
    })
  },
  {
    path: '/api/transactions/{transactionId}/status',
    ...op({
      tags: ['Transactions'],
      summary: 'Update transaction status',
      method: 'patch',
      apiPath: '/api/transactions/{transactionId}/status',
      body: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string' } }
      }
    })
  },
  {
    path: '/api/transactions/{transactionId}/tracking',
    ...op({
      tags: ['Transactions'],
      summary: 'Update transaction tracking',
      method: 'patch',
      apiPath: '/api/transactions/{transactionId}/tracking',
      body: {
        type: 'object',
        properties: {
          trackingNumber: { type: 'string' },
          carrier: { type: 'string' }
        }
      }
    })
  },
  {
    path: '/api/transactions/{transactionId}/refund',
    ...op({
      tags: ['Transactions'],
      summary: 'Refund transaction',
      method: 'post',
      apiPath: '/api/transactions/{transactionId}/refund',
      body: {
        type: 'object',
        properties: { reason: { type: 'string' }, amount: { type: 'number' } }
      }
    })
  },
  {
    path: '/api/transactions/{transactionId}/dispute',
    ...op({
      tags: ['Transactions'],
      summary: 'Open transaction dispute',
      method: 'post',
      apiPath: '/api/transactions/{transactionId}/dispute',
      body: {
        type: 'object',
        properties: { reason: { type: 'string' }, details: { type: 'string' } }
      }
    })
  },
  {
    path: '/api/transactions/{transactionId}/installments/{installmentNumber}',
    ...op({
      tags: ['Transactions'],
      summary: 'Pay installment',
      method: 'post',
      apiPath: '/api/transactions/{transactionId}/installments/{installmentNumber}'
    })
  },
  {
    path: '/api/transactions/{transactionId}/cancel',
    ...op({
      tags: ['Transactions'],
      summary: 'Cancel transaction',
      method: 'post',
      apiPath: '/api/transactions/{transactionId}/cancel',
      body: {
        type: 'object',
        properties: { reason: { type: 'string' } }
      }
    })
  },

  // Dashboard extras not in dashboard-swagger.js
  {
    path: '/api/dashboard/sales/comprehensive',
    ...op({
      tags: ['Dashboard'],
      summary: 'Comprehensive sales analytics',
      method: 'get',
      apiPath: '/api/dashboard/sales/comprehensive'
    })
  },
  {
    path: '/api/dashboard/overview',
    ...op({
      tags: ['Dashboard'],
      summary: 'Dashboard overview',
      method: 'get',
      apiPath: '/api/dashboard/overview'
    })
  },

  // Admin artist extras
  {
    path: '/api/admin/artists/{artistId}/info',
    ...op({
      tags: ['Admin'],
      summary: 'Get artist info (admin)',
      method: 'get',
      apiPath: '/api/admin/artists/{artistId}/info'
    })
  },
  {
    path: '/api/admin/artists/{artistId}/artworks',
    ...op({
      tags: ['Admin'],
      summary: 'Get artist artworks (admin)',
      method: 'get',
      apiPath: '/api/admin/artists/{artistId}/artworks',
      query: paginationParams()
    })
  },
  {
    path: '/api/admin/artists/{artistId}/reports',
    ...op({
      tags: ['Admin'],
      summary: 'Get artist reports (admin)',
      method: 'get',
      apiPath: '/api/admin/artists/{artistId}/reports',
      query: paginationParams()
    })
  },
  {
    path: '/api/admin/artists/{artistId}/reviews',
    ...op({
      tags: ['Admin'],
      summary: 'Get artist reviews (admin)',
      method: 'get',
      apiPath: '/api/admin/artists/{artistId}/reviews',
      query: paginationParams()
    })
  },

  // System
  {
    path: '/api',
    ...op({
      tags: ['System'],
      summary: 'API root info',
      method: 'get',
      apiPath: '/api',
      auth: false
    })
  },
  {
    path: '/health',
    ...op({
      tags: ['System'],
      summary: 'Health check with DB status',
      method: 'get',
      apiPath: '/health',
      auth: false
    })
  },
  {
    path: '/api/health',
    ...op({
      tags: ['System'],
      summary: 'API health check',
      method: 'get',
      apiPath: '/api/health',
      auth: false
    })
  },
  {
    path: '/api/db-test',
    ...op({
      tags: ['System'],
      summary: 'Database connection test',
      method: 'get',
      apiPath: '/api/db-test',
      auth: false
    })
  },
  {
    path: '/api/keepalive',
    ...op({
      tags: ['System'],
      summary: 'Keepalive / warm function',
      method: 'get',
      apiPath: '/api/keepalive',
      auth: false
    })
  }
];

const deadDocumentedPaths = [
  '/api/reports',
  '/api/follow', // wrong stub POST/DELETE
  '/api/special-requests', // GET list-all does not exist (POST create may remain from existing)
  '/api/reviews',
  '/api/notifications/stats',
  '/api/notifications/bulk',
  '/api/notifications/token/firebase'
];

function mergePathItem(target, source) {
  if (!target) return structuredClone(source);
  const out = { ...target };
  for (const [method, operation] of Object.entries(source)) {
    if (method.startsWith('x-')) {
      out[method] = operation;
      continue;
    }
    // Prefer richer existing docs; only fill if missing
    if (!out[method]) {
      out[method] = operation;
    }
  }
  return out;
}

function renameUsersToUser(paths) {
  const next = {};
  for (const [p, item] of Object.entries(paths)) {
    if (p.startsWith('/api/users')) {
      const newPath = p.replace('/api/users', '/api/user');
      next[newPath] = mergePathItem(next[newPath], item);
    } else {
      next[p] = mergePathItem(next[p], item);
    }
  }
  return next;
}

function ensureTags(doc) {
  const tagSet = new Map((doc.tags || []).map(t => [t.name, t]));
  const extras = [
    { name: 'Admin', description: 'Admin dashboard management' },
    { name: 'Dashboard', description: 'Analytics and dashboard statistics' },
    { name: 'Categories', description: 'Artwork categories' },
    { name: 'Follow', description: 'Follow / unfollow artists' },
    { name: 'Special Requests', description: 'Custom art requests' },
    { name: 'Transactions', description: 'Orders and payments' },
    { name: 'System', description: 'Health and operational endpoints' },
    { name: 'Order Management', description: 'Admin order management' },
    { name: 'Reviews Management', description: 'Admin reviews management' },
    { name: 'Reports Management', description: 'Admin reports management' }
  ];
  for (const t of extras) {
    if (!tagSet.has(t.name)) tagSet.set(t.name, t);
  }
  doc.tags = [...tagSet.values()];
}

function ensureSecuritySchemes(doc) {
  doc.components = doc.components || {};
  doc.components.securitySchemes = {
    ...(doc.components.securitySchemes || {}),
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token from /api/auth/login or /api/admin/login'
    },
    FirebaseAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Firebase ID token (Authorization: Bearer <firebaseIdToken>)'
    }
  };
  if (!doc.components.schemas?.SuccessResponse) {
    doc.components.schemas = doc.components.schemas || {};
    doc.components.schemas.SuccessResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        data: { type: 'object' },
        status: { type: 'integer', example: 200 }
      }
    };
  }
  if (!doc.components.schemas?.ErrorResponse) {
    doc.components.schemas = doc.components.schemas || {};
    doc.components.schemas.ErrorResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        error: { type: 'string' },
        status: { type: 'integer', example: 400 }
      }
    };
  }
}

async function main() {
  console.log('Rebuilding Swagger for Vercel...');
  const doc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

  // Backup
  const backupPath = path.join(root, 'src', 'swagger', `arthub-swagger.backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(doc, null, 2));
  console.log('Backup:', backupPath);

  // Fix user mount path
  doc.paths = renameUsersToUser(doc.paths || {});

  // Merge admin + dashboard modules (fill gaps / overwrite stubs with richer docs)
  for (const [p, item] of Object.entries(adminPaths)) {
    doc.paths[p] = { ...(doc.paths[p] || {}), ...item };
  }
  for (const [p, item] of Object.entries(dashboardPaths)) {
    doc.paths[p] = { ...(doc.paths[p] || {}), ...item };
  }

  // Add missing specs (do not overwrite richer existing operations)
  for (const spec of missingSpecs) {
    const { path: p, ...methods } = spec;
    if (!doc.paths[p]) {
      doc.paths[p] = methods;
    } else {
      for (const [method, operation] of Object.entries(methods)) {
        if (!doc.paths[p][method]) {
          doc.paths[p][method] = operation;
        }
      }
    }
  }

  // Remove dead documented endpoints that are not implemented
  // Keep POST /api/special-requests if present
  for (const dead of deadDocumentedPaths) {
    if (dead === '/api/special-requests' && doc.paths[dead]) {
      const onlyPost = {};
      if (doc.paths[dead].post) onlyPost.post = doc.paths[dead].post;
      if (Object.keys(onlyPost).length) doc.paths[dead] = onlyPost;
      else delete doc.paths[dead];
      continue;
    }
    if (dead === '/api/follow' && doc.paths[dead]) {
      delete doc.paths[dead];
      continue;
    }
    if (doc.paths[dead]) delete doc.paths[dead];
  }

  // Remove generic GET/POST /api/reviews if they exist (not implemented)
  if (doc.paths['/api/reviews']) {
    delete doc.paths['/api/reviews'];
  }

  // Servers: production Vercel first, relative for same-origin Try-it-out, then local
  doc.servers = [
    {
      url: PRODUCTION_URL,
      description: 'Vercel production'
    },
    {
      url: '/',
      description: 'Same origin (recommended for Try it out on the deployed host)'
    },
    {
      url: 'https://arthub-backend.up.railway.app',
      description: 'Railway (legacy)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development'
    }
  ];

  ensureTags(doc);
  ensureSecuritySchemes(doc);

  // Sort paths for readability
  const sorted = {};
  for (const key of Object.keys(doc.paths).sort()) {
    sorted[key] = doc.paths[key];
  }
  doc.paths = sorted;

  fs.writeFileSync(swaggerPath, JSON.stringify(doc, null, 2));

  // Also sync root swagger.json for convenience
  fs.writeFileSync(path.join(root, 'swagger.json'), JSON.stringify(doc, null, 2));
  fs.writeFileSync(path.join(root, 'src', 'swagger', 'swagger.json'), JSON.stringify(doc, null, 2));

  const opCount = Object.values(doc.paths).reduce(
    (n, item) => n + Object.keys(item).filter(k => !k.startsWith('x-')).length,
    0
  );
  console.log(`Done. Paths: ${Object.keys(doc.paths).length}, Operations: ${opCount}`);
  console.log(`Primary server: ${PRODUCTION_URL}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
