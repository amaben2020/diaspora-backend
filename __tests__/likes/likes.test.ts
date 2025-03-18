import request from 'supertest';

import { testDB } from '../../src/testDb';
import { likesTable } from '../../src/schema/likesTable';
import { afterAll, describe, expect, it, beforeEach } from 'vitest';
import { TEST_CLERK_USER_ID, TEST_TIMEOUT_DURATION } from '../config';
import { userToken as token } from './../config/index';
import { server } from '../..';
import { testGetClient } from '../utils';

const userToken = token();

describe('POST /likes', () => {
  let firstUser: string;
  let secondUser: string;

  beforeEach(async () => {
    // Reset the database before each test
    await testDB.delete(likesTable).execute();

    try {
      const usersWithLocationOne = await testGetClient(
        `/api/v1/users?userId=${TEST_CLERK_USER_ID}&radius=[1,22]&age=[18,60]`,
      );

      const userIds = usersWithLocationOne.body.users.slice(0, 2);
      firstUser = userIds[0].id;
      secondUser = userIds[1].id;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error; // Fail test setup if user fetch fails
    }
  }, TEST_TIMEOUT_DURATION);

  it('should like another user and return 201', async () => {
    const response = await request(server)
      .post('/api/v1/likes')
      .send({ likerId: firstUser, likedId: secondUser })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    console.log('LIKE RESPONSE 🔥', response);
    // expect(response).toHaveLength(1);

    expect(response.body).toEqual({
      likerId: firstUser,
      likedId: secondUser,
      likedAt: expect.any(String),
    });
  });

  it('should return 400 if the like already exists', async () => {
    // First like request (should succeed)
    await request(server)
      .post('/api/v1/likes')
      .send({ likerId: firstUser, likedId: secondUser })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    // Second like request (should fail)
    const response = await request(server)
      .post('/api/v1/likes')
      .send({ likerId: firstUser, likedId: secondUser })
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);

    expect(response.body).toEqual({ error: 'Like already exists' });
  });

  afterAll(async () => {
    await testDB.delete(likesTable).execute();
  });
});
