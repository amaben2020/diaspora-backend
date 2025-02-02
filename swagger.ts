import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/routes/hello.ts']; // Replace with your API routes file(s)

swaggerAutogen(outputFile, endpointsFiles);
