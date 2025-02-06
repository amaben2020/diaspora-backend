import { userSchema } from '../../models/index.ts';
import { createUser } from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

export const userCreateController = tryCatchFn(async (req, res, next) => {
  const { clerkId } = userSchema.parse(req.body);

  console.log('clerkId', clerkId);

  const data = await createUser(clerkId);

  console.log('data', data);

  if (!clerkId) {
    res.status(400).send('Clerk id not found');
  }

  if (!data) {
    next(new Error('User not created'));
  }

  res.status(201).json(data);
});
