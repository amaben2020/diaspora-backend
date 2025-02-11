import swaggerAutogen from 'swagger-autogen';

const URL =
  process.env.NODE_ENV! === 'development'
    ? 'localhost:8000'
    : process.env.BACKEND_URL;

const doc = {
  info: {
    version: '', // by default: '1.0.0'
    title: 'Diaspora', // by default: 'REST API'
    description: 'Diaspora backend API documentation ', // by default: ''
  },
  // TODO: add backend url here
  host: `${URL}/api/v1`, // by default: 'localhost:3000'
  basePath: '', // by default: '/'
  schemes: [], // by default: ['http']
  consumes: [],
  produces: [],
  tags: [
    // by default: empty Array
    {
      name: '', // Tag name
      description: '', // Tag description
    },
    // { ... }
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
  security: [],
  definitions: {}, // by default: empty object
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc);

// import swaggerAutogen from 'swagger-autogen';

// const URL =
//   process.env.NODE_ENV === 'development'
//     ? 'http://localhost:8000'
//     : process.env.BACKEND_URL || 'https://diaspora-backend.onrender.com';

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
