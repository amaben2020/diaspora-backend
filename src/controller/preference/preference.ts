import { paramSchema, preferencesSchema } from '../../models/index.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import {
  createPreference,
  getPreference,
  updatePreference,
} from '../../core/preference.ts';

export const preferenceCreateController = tryCatchFn(async (req, res, next) => {
  const { userId, lookingToDate } = preferencesSchema.parse(req.body);

  if (!userId) res.status(400).send('User id not found');

  const data = await createPreference(lookingToDate!, String(userId));

  if (!data) next(new Error('Preference not created'));

  res.status(201).json(data);
});

export const preferenceUpdateController = tryCatchFn(async (req, res, next) => {
  const { id, userId } = paramSchema.parse(req.params);

  const sanitizedBody = preferencesSchema.parse(req.body);

  const data = await updatePreference(sanitizedBody, Number(id), userId!);

  if (!data?.id) {
    return next(new Error('Preference not updated'));
  }

  res.status(201).json(data);
});

export const preferenceGetController = tryCatchFn(async (req, res, next) => {
  const { id } = paramSchema.parse(req.params);

  const data = await getPreference(id);

  // TODO: add a method isUserExist
  if (!data) {
    return next(new Error('User not found'));
  }

  res.status(200).json(data);
});
