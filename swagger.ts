import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';

dotenv.config();

const URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : process.env.BACKEND_URL!;
console.log('swagger ===> url', URL);

if (!URL) {
  throw new Error('BACKEND_URL is not defined in the environment variables.');
}

const doc = {
  info: {
    version: '1.0.0',
    title: 'Diaspora',
    description: 'Diaspora backend API documentation',
  },
  host: URL.replace(/https?:\/\//, ''),
  // host: 'localhost:8000',
  basePath: '/api/v1',
  schemes: [URL.startsWith('https') ? 'https' : 'http'],
  // schemes: [],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication related endpoints',
    },
  ],
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description:
        "Bearer token for authentication. Please type in 'Bearer' followed by a space and then the token.",
    },
  },
  security: [],
  definitions: {},
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);
