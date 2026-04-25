import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Execra Sovereign OS API',
      version: '7.0.0',
      description: 'Enterprise Workflow Automation Platform',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.yourdomain.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/index.ts', './src/legacyRoutes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
