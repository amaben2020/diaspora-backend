import { userSchema } from '../../models/index.ts';
import { createUser, updateUser } from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { z } from 'zod';

export const userCreateController = tryCatchFn(async (req, res, next) => {
  const { clerkId } = userSchema.parse(req.body);

  const data = await createUser(clerkId!);

  if (!clerkId) res.status(400).send('Clerk id not found');

  if (!data) next(new Error('User not created'));

  res.status(201).json(data);
});

const paramSchema = z.object({
  id: z.string(),
});

export const userUpdateController = tryCatchFn(async (req, res, next) => {
  const { id } = paramSchema.parse(req.params);

  const sanitizedBody = userSchema.parse(req.body);

  const data = await updateUser(sanitizedBody, id);

  if (!data) next(new Error('User not created'));

  res.status(201).json(data);
});
