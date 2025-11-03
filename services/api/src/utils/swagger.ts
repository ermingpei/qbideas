import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'qbideas API',
      version: '1.0.0',
      description: 'AI-powered idea marketplace API',
      contact: {
        name: 'qbideas Team',
        email: 'support@qbideas.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.qbideas.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'AUTH_001',
                },
                message: {
                  type: 'string',
                  example: 'Invalid credentials',
                },
                details: {
                  type: 'object',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                requestId: {
                  type: 'string',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            emailVerified: {
              type: 'boolean',
            },
            profileImageUrl: {
              type: 'string',
              format: 'uri',
            },
            bio: {
              type: 'string',
            },
            reputationScore: {
              type: 'integer',
            },
            totalEarnings: {
              type: 'number',
            },
            availableBalance: {
              type: 'number',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Idea: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            slug: {
              type: 'string',
            },
            teaserDescription: {
              type: 'string',
            },
            fullDescription: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            tier: {
              type: 'string',
              enum: ['regular', 'premium'],
            },
            source: {
              type: 'string',
              enum: ['ai', 'community'],
            },
            overallScore: {
              type: 'number',
            },
            viewCount: {
              type: 'integer',
            },
            likeCount: {
              type: 'integer',
            },
            commentCount: {
              type: 'integer',
            },
            unlockCount: {
              type: 'integer',
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
            },
            unlockPrice: {
              type: 'number',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {},
                },
                meta: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                    },
                    limit: {
                      type: 'integer',
                    },
                    total: {
                      type: 'integer',
                    },
                    totalPages: {
                      type: 'integer',
                    },
                    hasNext: {
                      type: 'boolean',
                    },
                    hasPrev: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'qbideas API Documentation',
  }));
  
  // Serve swagger.json
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};