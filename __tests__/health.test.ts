import { describe, expect, it } from 'vitest';
import { app } from '../app';

import { config } from 'dotenv';
import { testApi } from './config';
import { userToken as token } from './config/index';

const userToken = token();
config({ path: '.env.test' });

describe('GET /api/v1/health', () => {
  it('should return 200 and the correct health status', async () => {
    const server = app.listen(9000);

    try {
      // Make a GET request to the /api/v1/health endpoint
      const response = await testApi.get('/health', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Assert the response
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        status: 200,
        message: 'Running...',
        port: process.env.PORT,
        isDev: process.env.ENVIRONMENT === 'development',
      });
    } finally {
      // Close the server after the test
      server.close();
    }
  });
});
