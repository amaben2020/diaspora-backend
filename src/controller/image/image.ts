import { v2 as cloudinary } from 'cloudinary';
import { type Request, type Response } from 'express';
import { db } from '../../db.ts';
import { imagesTable } from '../../schema/imagesTable.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate Cloudinary upload signature
export const getImageUploadUrlController = async (
  req: Request,
  res: Response,
) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'user_uploads';
    const upload_preset = 'diaspora';

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, upload_preset },
      process.env.CLOUDINARY_API_SECRET!,
    );

    // Return Cloudinary credentials
    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      upload_preset,
    });
  } catch (error) {
    if (error instanceof Error) res.status(500).json({ error: error.message });
  }
};

// Save image URL to the database
export const createImageUrlController = tryCatchFn(async (req, res, next) => {
  const { userId, imageUrl } = req.body;

  if (!userId || !imageUrl) {
    res.status(400).json({ error: 'Missing userId or imageUrl' });
    return next(new Error('Missing userId or imageUrl'));
  }

  // Insert image URL into the database
  const insertedImage = await db
    .insert(imagesTable)
    .values({
      userId,
      imageUrl,
    })
    .returning();

  res.json(insertedImage);
});
