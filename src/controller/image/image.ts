// import { v2 as cloudinary } from 'cloudinary';
// import { type Request, type Response } from 'express';
// import { db } from '../../db.ts';
// import { imagesTable } from '../../schema/imagesTable.ts';
// import { tryCatchFn } from '../../utils/tryCatch.ts';

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Generate Cloudinary upload signature
// export const getImageUploadUrlController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const timestamp = Math.floor(Date.now() / 1000);
//     const folder = 'user_uploads';
//     const upload_preset = 'diaspora';

//     // Generate signature
//     const signature = cloudinary.utils.api_sign_request(
//       { timestamp, folder, upload_preset },
//       process.env.CLOUDINARY_API_SECRET!,
//     );

//     // Return Cloudinary credentials
//     res.json({
//       cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//       apiKey: process.env.CLOUDINARY_API_KEY,
//       timestamp,
//       signature,
//       folder,
//       upload_preset,
//     });
//   } catch (error) {
//     if (error instanceof Error) res.status(500).json({ error: error.message });
//   }
// };

// export const createImageUrlController = tryCatchFn(async (req, res, next) => {
//   const { userId, images } = req.body;

//   if (!userId || !images || !Array.isArray(images)) {
//     res
//       .status(400)
//       .json({ error: 'Missing userId or images, or images is not an array' });
//     return next(new Error('Invalid input'));
//   }

//   // Insert each image URL into the database
//   const insertedImages = await Promise.all(
//     images.map(async (image) => {
//       const [insertedImage] = await db
//         .insert(imagesTable)
//         .values({
//           userId,
//           imageUrl: image.imageUrl,
//           order: image.order || 1, // Default order is 1
//         })
//         .returning();
//       return insertedImage;
//     }),
//   );

//   res.json(insertedImages);
// });

// import { v2 as cloudinary } from 'cloudinary';
// import { type Request, type Response } from 'express';
// import { db } from '../../db.ts';
// import { imagesTable } from '../../schema/imagesTable.ts';
// import { tryCatchFn } from '../../utils/tryCatch.ts';
// import { eq, and } from 'drizzle-orm';

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Generate Cloudinary upload signature
// export const getImageUploadUrlController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const timestamp = Math.floor(Date.now() / 1000);
//     const folder = 'user_uploads';
//     const upload_preset = 'diaspora';

//     // Generate signature
//     const signature = cloudinary.utils.api_sign_request(
//       { timestamp, folder, upload_preset },
//       process.env.CLOUDINARY_API_SECRET!,
//     );

//     // Return Cloudinary credentials
//     res.json({
//       cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//       apiKey: process.env.CLOUDINARY_API_KEY,
//       timestamp,
//       signature,
//       folder,
//       upload_preset,
//     });
//   } catch (error) {
//     if (error instanceof Error) res.status(500).json({ error: error.message });
//   }
// };

// export const createImageUrlController = tryCatchFn(async (req, res, next) => {
//   const { userId, images } = req.body;

//   if (!userId || !images || !Array.isArray(images)) {
//     res
//       .status(400)
//       .json({ error: 'Missing userId or images, or images is not an array' });
//     return next(new Error('Invalid input'));
//   }

//   // Get existing images for this user
//   const existingImages = await db
//     .select()
//     .from(imagesTable)
//     .where(eq(imagesTable.userId, userId));

//   // Map of order to existing image ID
//   const existingImageMap = new Map(
//     existingImages.map((img) => [img.order, img.id]),
//   );

//   // Process each image - update if exists, insert if new
//   const processedImages = await Promise.all(
//     images.map(async (image) => {
//       const order = image.order || 1;
//       const existingImageId = existingImageMap.get(order);

//       if (existingImageId) {
//         // Update existing image
//         const [updatedImage] = await db
//           .update(imagesTable)
//           .set({
//             imageUrl: image.imageUrl,
//             // updatedAt: new Date(),
//           })
//           .where(
//             and(
//               eq(imagesTable.id, existingImageId),
//               eq(imagesTable.userId, userId),
//             ),
//           )
//           .returning();
//         return updatedImage;
//       } else {
//         // Insert new image
//         const [insertedImage] = await db
//           .insert(imagesTable)
//           .values({
//             userId,
//             imageUrl: image.imageUrl,
//             order,
//           })
//           .returning();
//         return insertedImage;
//       }
//     }),
//   );

//   res.json(processedImages);
// });

import { v2 as cloudinary } from 'cloudinary';
import { type Request, type Response } from 'express';
import { db } from '../../db.ts';
import { imagesTable } from '../../schema/imagesTable.ts';
import { tryCatchFn } from '../../utils/tryCatch.ts';
import { eq, and } from 'drizzle-orm';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'amaben',
  api_key: process.env.CLOUDINARY_API_KEY || '167243632659323',
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
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'amaben',
      apiKey: process.env.CLOUDINARY_API_KEY || '167243632659323',
      timestamp,
      signature,
      folder,
      upload_preset,
    });
  } catch (error) {
    if (error instanceof Error) res.status(500).json({ error: error.message });
  }
};

// Get user images controller - Fetch all images for a user
export const getUserImagesController = tryCatchFn(async (req, res, next) => {
  const userId = req.params.userId;

  if (!userId) {
    res.status(400).json({ error: 'Missing userId parameter' });
    return next(new Error('Invalid input'));
  }

  // Get all images for this user, ordered by the order field
  const userImages = await db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.userId, userId))
    .orderBy(imagesTable.order);

  res.json(userImages);
});

// Create or update image URLs controller
export const createImageUrlController = tryCatchFn(async (req, res, next) => {
  const { userId, images } = req.body;

  if (!userId || !images || !Array.isArray(images)) {
    res
      .status(400)
      .json({ error: 'Missing userId or images, or images is not an array' });
    return next(new Error('Invalid input'));
  }

  try {
    // Get existing images for this user
    const existingImages = await db
      .select()
      .from(imagesTable)
      .where(eq(imagesTable.userId, userId));

    // Map of order to existing image ID
    const existingImageMap = new Map(
      existingImages.map((img) => [img.order, img.id]),
    );

    // Process each image - update if exists, insert if new
    const processedImages = await Promise.all(
      images.map(async (image) => {
        const order = image.order || 1;
        const existingImageId = existingImageMap.get(order);

        if (existingImageId) {
          // Update existing image
          const [updatedImage] = await db
            .update(imagesTable)
            .set({
              imageUrl: image.imageUrl,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(imagesTable.id, existingImageId),
                eq(imagesTable.userId, userId),
              ),
            )
            .returning();
          return updatedImage;
        } else {
          // Insert new image
          const [insertedImage] = await db
            .insert(imagesTable)
            .values({
              userId,
              imageUrl: image.imageUrl,
              order,
            })
            .returning();
          return insertedImage;
        }
      }),
    );

    res.json(processedImages);
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: 'Failed to process images' });
    return next(error);
  }
});
