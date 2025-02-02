import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: '', // by default: '1.0.0'
    title: 'Diaspora', // by default: 'REST API'
    description: 'Diaspora backend API documentation ', // by default: ''
  },
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
  securityDefinitions: {}, // by default: empty object
  definitions: {}, // by default: empty object
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc);
