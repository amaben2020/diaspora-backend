import axios from 'axios';
export const TEST_CLERK_USER_ID = 'user_2tqL5qdC0eEqdBUUWknFnoBWKct';

export const testApi = axios.create({
  baseURL: 'http://localhost:9000/api/v1',
});

export const userToken = () => {
  const userToken = process.env.TEST_USER_TOKEN;

  if (!userToken) {
    throw new Error(
      'Provide a TEST_USER_TOKEN env variable for testing - visit: https://dev.to/mad/api-testing-with-clerk-and-express-2i56',
    );
  }

  return userToken;
};
