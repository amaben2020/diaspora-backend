import { z } from 'zod';

export const userSchema = z.object({
  clerkId: z.string().optional(),
  displayName: z.string().max(50).optional(),
  email: z.string().email().optional(),
  gender: z.string().max(20).optional(),
  birthday: z
    .string()
    .regex(/\d{2}-\d{2}-\d{4}/)
    .optional(),
  verified: z.boolean().default(false),
  showGender: z.boolean().default(false),
  lastLogin: z.string().datetime().optional(),
  subscriptionType: z.string().max(20).default('free'),
  phone: z.string().max(11).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const preferencesSchema = z.object({
  userId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  // Personal info
  ethnicity: z.string().max(50).optional(),
  pronouns: z.string().max(50).optional(),
  zodiac: z.string().max(50).optional(),
  bio: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  height: z.string().max(50).optional(),
  age: z.string().max(50).optional(),

  // Preferences
  interests: z.array(z.string()).optional(),
  lookingToDate: z.array(z.string()).optional(),

  // Lifestyle
  smoking: z.boolean().optional(),
  drinking: z.boolean().optional(),
  religion: z.string().max(50).optional(),
  education: z.string().max(50).optional(),
  pets: z.string().max(50).optional(),
  familyPlans: z.string().max(50).optional(),
  language: z.string().max(50).optional(),

  // Settings
  distance: z.string().max(50).optional(),
  hasBio: z.boolean().optional(),
  minNumberOfPhotos: z.string().optional(),
  connections: z.string().optional(),
});

export const imagesSchema = z.object({
  userId: z.string(),
  imageUrl: z.string().url(),
  order: z.number().int().positive().default(1),
});

export const paramSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
});

export const locationSchema = z.object({
  userId: z.string(),
  latitude: z.string(),
  longitude: z.string(),
});
