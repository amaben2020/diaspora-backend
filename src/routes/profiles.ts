// src/routes/profiles.ts
import express from 'express';
import {
  createProfileController,
  getProfileController,
  updateProfileController,
  deleteProfileController,
} from '../controller/profiles/profiles.ts';

const router = express.Router();

router.post('/profile', createProfileController);
router.get('/profile/:userId', getProfileController);
router.put('/profile/:userId', updateProfileController);
router.delete('/profile/:userId', deleteProfileController);

export default router;
