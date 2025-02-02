import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '', // by default: '1.0.0'
    title: 'Diaspora', // by default: 'REST API'
    description: 'Diaspora backend API documentation ', // by default: ''
  },
  // TODO: add backend url here
  host: 'localhost:8000/api/v1', // by default: 'localhost:3000'
  basePath: '', // by default: '/'
  schemes: [], // by default: ['http']
  consumes: [], // by default: ['application/json']
  produces: [], // by default: ['application/json']
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
