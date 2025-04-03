// src/routes/favorites.ts
import express from 'express';
import {
  getFavoritesController,
  addFavoriteController,
  removeFavoriteController,
} from '../controller/favorites/favorites.ts';

const router = express.Router();

router.post('/favorites', addFavoriteController);
router.delete('/favorites/:userId/:favoriteUserId', removeFavoriteController);
router.get('/favorites/:userId', getFavoritesController);

export default router;
