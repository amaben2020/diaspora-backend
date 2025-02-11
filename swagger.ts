// import swaggerAutogen from 'swagger-autogen';

// const URL =
//   process.env.NODE_ENV! === 'development'
//     ? 'localhost:8000'
//     : process.env.BACKEND_URL;

// const doc = {
//   info: {
//     version: '', // by default: '1.0.0'
//     title: 'Diaspora', // by default: 'REST API'
//     description: 'Diaspora backend API documentation ', // by default: ''
//   },
//   // TODO: add backend url here
//   host: `${URL}/api/v1`, // by default: 'localhost:3000'
//   basePath: '', // by default: '/'
//   schemes: [], // by default: ['http']
//   consumes: [], // by default: ['application/json']
//   produces: [], // by default: ['application/json']
//   tags: [
//     // by default: empty Array
//     {
//       name: '', // Tag name
//       description: '', // Tag description
//     },
//     // { ... }
//   ],

//   securityDefinitions: {
//     apiKeyAuth: {
//       type: 'apiKey',
//       in: 'header', // can be 'header', 'query' or 'cookie'
//       name: 'Authorization', // name of the header, query parameter or cookie
//       description:
//         "Bearer token for authentication. Please type in 'Bearer' followed by a space and then the token.",
//     },
//   },
//   security: [],
//   definitions: {}, // by default: empty object
// };

// const outputFile = './swagger_output.json';
// const endpointsFiles = ['./src/routes/index.ts'];
// swaggerAutogen(outputFile, endpointsFiles, doc);

import swaggerAutogen from 'swagger-autogen';

// Ensure BACKEND_URL is set in production
const URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : process.env.BACKEND_URL || 'https://diaspora-backend.onrender.com';

if (!URL) {
  throw new Error('BACKEND_URL is not defined in the environment variables.');
}

const doc = {
  info: {
    version: '1.0.0', // by default: '1.0.0'
    title: 'Diaspora', // by default: 'REST API'
    description: 'Diaspora backend API documentation', // by default: ''
  },
  host: URL.replace(/https?:\/\//, ''), // Remove http:// or https://
  basePath: '/api/v1', // by default: '/'
  schemes: [URL.startsWith('https') ? 'https' : 'http'], // Set based on URL
  consumes: ['application/json'], // by default: ['application/json']
  produces: ['application/json'], // by default: ['application/json']
  tags: [
    // by default: empty Array
    {
      name: 'Auth', // Tag name
      description: 'Authentication related endpoints', // Tag description
    },
    // Add more tags as needed
  ],
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header', // can be 'header', 'query' or 'cookie'
      name: 'Authorization', // name of the header, query parameter or cookie
      description:
        "Bearer token for authentication. Please type in 'Bearer' followed by a space and then the token.",
    },
  },
  security: [], // by default: empty array
  definitions: {}, // by default: empty object
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts']; // Ensure this path is correct

swaggerAutogen(outputFile, endpointsFiles, doc);
