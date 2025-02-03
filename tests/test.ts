import request from 'supertest';

import { describe, expect, it } from 'vitest';
import { app } from '..';

const userToken = process.env.TEST_USER_TOKEN;
if (!userToken) {
  throw new Error(
    'Provide a TEST_USER_TOKEN env variable for testing - visit: https://dev.to/mad/api-testing-with-clerk-and-express-2i56',
  );
}

describe('POST /api/product', () => {
  it('responds with a new todo', async () =>
    request(app)
      .post('/api/product')
      .set('Accept', 'application/json')
      // FOCUS ON THIS
      .auth(userToken, { type: 'bearer' })
      .send({
        title: 'test product 1',
        description: 'test description',
        price: 2.0,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).toHaveProperty('id');
        id = res.body.id;
      }));
});
