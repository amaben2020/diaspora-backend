import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';

dotenv.config();
// Set the backend URL based on the environment
const isLocalServer = process.env.ENVIRONMENT === 'development';
const URL = isLocalServer
  ? process.env.DEV_SWAGGER_URL
  : process.env.ENVIRONMENT === 'local'
    ? 'http://localhost:8000'
    : '';

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
  basePath: '/api/v1',
  urls: ['as', 'sasa', 'sasas'],
  schemes: [URL.startsWith('https') ? 'https' : 'http'],
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
