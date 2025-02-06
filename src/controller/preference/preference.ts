import { preferencesSchema } from '../../models/index.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { createPreference } from '../../core/preference.ts';

export const preferenceCreateController = tryCatchFn(async (req, res, next) => {
  const { userId, lookingToDate } = preferencesSchema.parse(req.body);

  if (!userId) res.status(400).send('User id not found');

  const data = await createPreference(lookingToDate!, userId);

  if (!data) next(new Error('Preference not created'));

  res.status(201).json(data);
});
