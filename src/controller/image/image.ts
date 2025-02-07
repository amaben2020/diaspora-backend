import { v2 as cloudinary } from 'cloudinary';
import { type Request, type Response } from 'express';
import { db } from '../../db.ts';
import { imagesTable } from '../../schema/imagesTable.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

// TODO: Move to config file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getImageUploadUrlController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET!,
    );

    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: 'user_uploads',
    });
  } catch (error) {
    if (error instanceof Error) res.status(500).json({ error: error.message });
  }
};

export const createImageUrlController = tryCatchFn(async (req, res, next) => {
  const { userId, imageUrl } = req.body;

  if (!userId || !imageUrl) {
    res.status(400).json({ error: 'Missing userId or imageUrl' });
    next(new Error('Missing userId or imageUrl'));
  }

  const insertedImage = await db
    .insert(imagesTable)
    .values({
      userId,
      imageUrl,
    })
    .returning();

  res.json(insertedImage);
});
