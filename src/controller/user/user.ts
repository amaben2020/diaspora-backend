import { paramSchema, userSchema } from '../../models/index.ts';
import { createUser, updateUser } from '../../core/user.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

export const userCreateController = tryCatchFn(async (req, res, next) => {
  const { clerkId, phone } = userSchema.parse(req.body);

  const data = await createUser(clerkId!, phone);

  if (!clerkId) res.status(400).send('Clerk id not found');

  if (!data) next(new Error('User not created'));

  res.status(201).json(data);
});

// export const userUpdateController = tryCatchFn(async (req, res, next) => {
//   const { id } = paramSchema.parse(req.params);

//   const sanitizedBody = userSchema.parse(req.body);

//   const data = await updateUser(sanitizedBody, id);

//   console.log('data', data);

//   if (!data) next(new Error('User not created'));

//   res.status(204).json(data);
// });

export const userUpdateController = tryCatchFn(async (req, res, next) => {
  const { id } = paramSchema.parse(req.params);
  const sanitizedBody = userSchema.parse(req.body);

  const data = await updateUser(sanitizedBody, id);

  if (!data) {
    return next(new Error('User not updated')); // Ensure response is not sent twice
  }

  console.log('data', data);

  res.status(200).json(data); // Send a valid response
});
