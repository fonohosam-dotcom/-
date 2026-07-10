import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Takaful API Documentation',
      version: '2.0.0',
      description: 'API documentation for the National Takaful Platform',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/server/routes/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
