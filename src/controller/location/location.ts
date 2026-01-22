import { locationSchema } from '../../models/index.ts';

import { tryCatchFn } from '../../utils/tryCatch.ts';
import { createLocation } from '../../core/location.ts';
// import { createProfile } from '../../core/profile.ts';

export const locationCreateController = tryCatchFn(async (req, res, next) => {
  const { userId, latitude, longitude } = locationSchema.parse(req.body);

  const data = await createLocation({ userId, latitude, longitude });

  // await createProfile({
  //   userId: userId as string,
  //   bio: 'Enter your bio',
  //   interests: [''],
  // });

  if (!userId) res.status(400).send('User id not found');

  if (!data) next(new Error('Location creation failed'));

  res.status(201).json(data);
});

// export const locationUpdateController = tryCatchFn(async (req, res, next) => {
//   const { id } = paramSchema.parse(req.params);
//   const sanitizedBody = locationSchema.parse(req.body);

//   const data = await updateLocation(sanitizedBody, id);

//   if (!data) {
//     return next(new Error('Location not updated'));
//   }

//   res.status(200).json(data);
// });

// export const locationGetController = tryCatchFn(async (req, res, next) => {
//   const { id } = paramSchema.parse(req.params);

//   const data = await getLocation(id);

//   // TODO: add a method isLocationExist
//   if (!data) {
//     return next(new Error('Location not found'));
//   }

//   res.status(200).json(data);
// });
