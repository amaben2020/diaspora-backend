import { paramSchema, preferencesSchema } from '../../models/index.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { createPreference, updatePreference } from '../../core/preference.ts';

export const preferenceCreateController = tryCatchFn(async (req, res, next) => {
  const { userId, lookingToDate } = preferencesSchema.parse(req.body);

  if (!userId) res.status(400).send('User id not found');

  const data = await createPreference(lookingToDate!, userId);

  if (!data) next(new Error('Preference not created'));

  res.status(201).json(data);
});

export const preferenceUpdateController = tryCatchFn(async (req, res, next) => {
  const { id } = paramSchema.parse(req.params);

  const sanitizedBody = preferencesSchema.parse(req.body);

  const data = await updatePreference(sanitizedBody, Number(id));

  if (!data) next(new Error('User not created'));

  res.status(201).json(data);
});
