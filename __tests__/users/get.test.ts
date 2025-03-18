import { eq } from 'drizzle-orm';
import { beforeAll, describe, it } from 'vitest';
import { usersTable } from '../../src/schema/usersTable';
import { TEST_CLERK_USER_ID } from '../config';
import { server } from '../..';
import { createUser, isUserExists } from '../../src/core/user';
import { db } from '../../src/db';

describe('GET /api/v1/user/{id}', () => {
  beforeAll(async () => {
    const existingUser = await isUserExists(TEST_CLERK_USER_ID);

    if (existingUser.length === 0) {
      await createUser(TEST_CLERK_USER_ID, '07033333333');
      console.log('Test user created.');
    } else {
      console.log('Test user already exists.');
    }
  });
  it('should return 200 and the correct user info', async () => {
    try {
      const res = await db
        .select({})
        .from(usersTable)
        .where(eq(usersTable.id, TEST_CLERK_USER_ID));

      return res;
    } finally {
      // Close the server after the test
      server.close();
    }
  });
});
