import { app } from '../../app';
import { testDB } from '../../src/testDb';
import { likesTable } from '../../src/schema/likesTable';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_CLERK_USER_ID, testApi } from '../config';

import { userToken as token } from './../config/index';
import { isAxiosError } from 'axios';

const userToken = token();

describe('POST /likes', () => {
  let firstUser: string;
  let secondUser: string;
  let server: ReturnType<typeof app.listen>;

  beforeAll(async () => {
    server = app.listen(9000);
    // await new Promise((resolve) => server.on('listening', resolve));
    console.log('Server is running on port 9000');

    // Clean up the database
    await testDB
      .delete(likesTable)
      .where(
        eq(likesTable.likerId, firstUser) || eq(likesTable.likedId, secondUser),
      )
      .execute();

    try {
      const usersWithLocationOne = await testApi.get(
        `/users?userId=${TEST_CLERK_USER_ID}&radius=[1,22]&age=[18,60]`,
      );

      const userIds = usersWithLocationOne?.data.users.slice(0, 2);
      firstUser = userIds[0].id;
      secondUser = userIds[1].id;

      console.log('First and second user:', firstUser, secondUser);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error; // Fail test setup if user fetch fails
    }
  }, 50000); // Increase timeout to 30 seconds

  it('should like another user and return 201', async () => {
    try {
      const likes = await testApi.post(
        '/likes',
        {
          likerId: firstUser,
          likedId: secondUser,
        },
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      expect(likes.status).toEqual(201);
      expect(likes.data).toEqual({
        likerId: firstUser,
        likedId: secondUser,
        likedAt: expect.any(String),
      });
    } catch (error) {
      console.error('Test failed:', error.response?.data || error.message);
      throw error; // Ensure test fails on error
    }
  });

  it('should return 400 if the like already exists', async () => {
    try {
      // Second request should fail
      await testApi.post(
        '/likes',
        { likerId: firstUser, likedId: secondUser },
        { headers: { Authorization: `Bearer ${userToken}` } },
      );

      throw new Error('Request should have failed but succeeded');
    } catch (error) {
      if (isAxiosError(error))
        // Ensure it's an Axios error with a response

        expect(error?.response).toBeDefined();
      expect(error?.response?.status).toBe(400);
      expect(error?.response?.data).toEqual({ error: 'Like already exists' });
    }
  });

  afterAll(async () => {
    try {
      server.close();
      await testDB
        .delete(likesTable)
        .where(eq(likesTable.likedId, secondUser))
        .execute();
    } catch (error) {
      console.log(error);
    }
  });
});

// import request from 'supertest';
// import { app } from '../../app';
// import { testDB } from '../../src/testDb';
// import { likesTable } from '../../src/schema/likesTable';
// // import { eq } from 'drizzle-orm';
// import { beforeEach, afterAll, describe, expect, it } from 'vitest';
// import { TEST_CLERK_USER_ID } from '../config';
// import { userToken as token } from './../config/index';

// const userToken = token();

// describe('POST /likes', () => {
//   let firstUser: string;
//   let secondUser: string;

//   beforeEach(async () => {
//     // Reset the database before each test
//     await testDB.delete(likesTable).execute();

//     try {
//       const usersWithLocationOne = await request(app)
//         .get(
//           `http://localhost:8000/api/v1/users?userId=${TEST_CLERK_USER_ID}&radius=[1,22]&age=[18,60]`,
//         )
//         .set('Authorization', `Bearer ${userToken}`)
//         .expect(200);

//       console.log('usersWithLocationOne', usersWithLocationOne);

//       const userIds = usersWithLocationOne.body.users.slice(0, 2);
//       firstUser = userIds[0].id;
//       secondUser = userIds[1].id;
//     } catch (error) {
//       console.error('Failed to fetch users:', error);
//       throw error; // Fail test setup if user fetch fails
//     }
//   });

//   it('should like another user and return 201', async () => {
//     const response = await request(app)
//       .post('/likes')
//       .send({ likerId: firstUser, likedId: secondUser })
//       .set('Authorization', `Bearer ${userToken}`)
//       .expect(201);

//     expect(response.body).toEqual({
//       likerId: firstUser,
//       likedId: secondUser,
//       likedAt: expect.any(String),
//     });
//   });

//   it('should return 400 if the like already exists', async () => {
//     // First like request (should succeed)
//     await request(app)
//       .post('/likes')
//       .send({ likerId: firstUser, likedId: secondUser })
//       .set('Authorization', `Bearer ${userToken}`)
//       .expect(201);

//     // Second like request (should fail)
//     const response = await request(app)
//       .post('/likes')
//       .send({ likerId: firstUser, likedId: secondUser })
//       .set('Authorization', `Bearer ${userToken}`)
//       .expect(400);

//     expect(response.body).toEqual({ error: 'Like already exists' });
//   });

//   afterAll(async () => {
//     await testDB.delete(likesTable).execute();
//   });
// });
