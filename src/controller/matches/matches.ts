import { tryCatchFn } from '../../utils/tryCatch.ts';
import { getMatches } from '../../core/matches.ts';

export const matchesGetController = tryCatchFn(async (req, res, next) => {
  const data = await getMatches(req.params.userId);

  // TODO: add a method isUserExist
  if (!data) {
    return next(new Error('User not found'));
  }

  res.status(200).json(data);
});
