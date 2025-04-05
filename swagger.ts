// import swaggerAutogen from 'swagger-autogen';
// import dotenv from 'dotenv';

// dotenv.config();
// // Set the backend URL based on the environment
// const isLocalServer = process.env.ENVIRONMENT === 'development';
// const URL = isLocalServer
//   ? process.env.DEV_SWAGGER_URL
//   : process.env.ENVIRONMENT === 'local'
//     ? 'http://localhost:8000'
//     : '';

// if (!URL) {
//   throw new Error('BACKEND_URL is not defined in the environment variables.');
// }

// const doc = {
//   info: {
//     version: '1.0.0',
//     title: 'Diaspora',
//     description: 'Diaspora backend API documentation',
//   },
//   host: URL.replace(/https?:\/\//, ''),
//   basePath: '/api/v1',
//   urls: ['as', 'sasa', 'sasas'],
//   schemes: [URL.startsWith('https') ? 'https' : 'http'],
//   consumes: ['application/json'],
//   produces: ['application/json'],
//   tags: [
//     {
//       name: 'Auth',
//       description: 'Authentication related endpoints',
//     },
//   ],
//   securityDefinitions: {
//     apiKeyAuth: {
//       type: 'apiKey',
//       in: 'header',
//       name: 'Authorization',
//       description:
//         "Bearer token for authentication. Please type in 'Bearer' followed by a space and then the token.",
//     },
//   },
//   security: [],
//   definitions: {},
// };

// const outputFile = './swagger_output.json';
// const endpointsFiles = ['./src/routes/index.ts'];

// swaggerAutogen(outputFile, endpointsFiles, doc);

import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';
import minimist from 'minimist';

// Load environment variables
dotenv.config();

// Parse command line arguments
const argv = minimist(process.argv.slice(2));
const environment = argv.ENVIRONMENT || process.env.NODE_ENV || 'development';

// Define your environment configurations
const ENV_CONFIGS = {
  development: {
    url: process.env.DEV_BACKEND_URL || 'http://localhost:8000',
    description: 'Local Development Server',
  },
  production: {
    url:
      process.env.PROD_BACKEND_URL || 'https://diaspora-backend.onrender.com',
    description: 'Production Server',
  },
  staging: {
    url:
      process.env.STAGING_BACKEND_URL ||
      'https://staging.diaspora-backend.onrender.com',
    description: 'Staging Server',
  },
  // Add more environments as needed
};

// Get the current environment config or default to development
const currentEnv = ENV_CONFIGS[environment] || ENV_CONFIGS.development;

if (!currentEnv.url) {
  throw new Error(`No backend URL configured for environment: ${environment}`);
}

const doc = {
  info: {
    version: '1.0.0',
    title: 'Diaspora',
    description: `Diaspora backend API documentation (${environment} environment)`,
  },
  servers: [
    {
      url: currentEnv.url + '/api/v1',
      description: currentEnv.description,
    },
    // You can keep other environments available in the dropdown
    ...Object.entries(ENV_CONFIGS)
      .filter(([key]) => key !== environment)
      .map(([_, config]) => ({
        url: config.url + '/api/v1',
        description: config.description,
      })),
  ],
  host: currentEnv.url.replace(/https?:\/\//, ''),
  basePath: '/api/v1',
  schemes: [currentEnv.url.startsWith('https') ? 'https' : 'http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  // ... rest of your Swagger config
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];

// Generate Swagger file
swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log(
      `Swagger documentation generated for ${environment} environment`,
    );
    console.log(`Base URL: ${currentEnv.url}`);
  })
  .catch((err) => {
    console.error('Error generating Swagger documentation:', err);
    process.exit(1);
  });
