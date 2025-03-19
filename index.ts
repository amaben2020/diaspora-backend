import { app } from './app.ts';

export const server = app.listen(process.env.PORT || 8000, () => {
  console.log('Server Healthy...🍀🍀🍀🍀');
});

const exitHandler = () => {
  if (server) {
    console.log('Server closed');
    process.exit(1);
  } else {
    process.exit(1);
  }
};

const unhandledExceptionErrorHandler = (error: Error) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unhandledExceptionErrorHandler);
process.on('unhandledRejection', unhandledExceptionErrorHandler);

process.on('SIGTERM', () => {
  if (server) {
    console.log('Server closed');
    process.exit(1);
  }
});
