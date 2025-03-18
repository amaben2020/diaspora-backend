import { afterAll, describe, expect, it } from 'vitest';

import { eq } from 'drizzle-orm';
import { usersTable } from '../../src/schema/usersTable';
import { testDB } from '../../src/testDb';
import { TEST_CLERK_USER_ID } from '../config/index';

describe('POST /api/v1/user', () => {
  it('should create a new user', async () => {
    const existingUser = await testDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, TEST_CLERK_USER_ID))
      .execute();

    if (existingUser.length === 0) {
      const result = await testDB
        .insert(usersTable)
        .values({
          id: TEST_CLERK_USER_ID,
          phone: '07033333333',
        })
        .returning();

      expect(result[0].id).toEqual(TEST_CLERK_USER_ID);
    } else {
      console.log('Test user already exists. 🔥');
    }
  });

  // afterAll(async () => {
  //   await testDB
  //     .delete(usersTable)
  //     .where(eq(usersTable.id, TEST_CLERK_USER_ID))
  //     .execute();
  //   console.log('Test user deleted.');
  // });
});
