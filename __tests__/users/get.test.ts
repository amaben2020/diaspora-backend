import { eq } from 'drizzle-orm';
import { beforeAll, describe, it } from 'vitest';
import { app } from '../../app';
import { testDB } from '../../src/testDb';
import { usersTable } from '../../src/schema/usersTable';
import { TEST_CLERK_USER_ID } from '../config';

// npm run test -- -t "should return 200 and the correct user info"

describe('GET /api/v1/user/{id}', () => {
  beforeAll(async () => {
    const existingUser = await testDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, TEST_CLERK_USER_ID))
      .execute();

    if (existingUser.length === 0) {
      await testDB.insert(usersTable).values({
        id: TEST_CLERK_USER_ID,
        phone: '07033333333',
      });
      console.log('Test user created.');
    } else {
      console.log('Test user already exists.');
    }
  });
  it('should return 200 and the correct user info', async () => {
    // Start your Express app on a test port
    const server = app.listen(9000);

    try {
      const res = await testDB
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
