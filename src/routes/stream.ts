import { StreamClient } from '@stream-io/node-sdk';
import dotenv from 'dotenv';
import { Router } from 'express';

dotenv.config();

// Constants
const apiKey = process.env.STREAM_API_KEY;
const secret = process.env.STREAM_API_SECRET;

if (!apiKey || !secret) {
  console.error('Stream API key or secret is missing in environment variables');
  process.exit(1);
}

// Initialize Stream client
const streamClient = new StreamClient(apiKey, secret);

const streamRoute = Router();

// Routes
streamRoute.post('/stream/token', async (req, res) => {
  try {
    const { userId, name, image, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const newUser = {
      id: userId,
      role: 'user',
      name: name || userId,
      image: image || '',
      custom: {
        email: email || '',
      },
    };

    // Upsert user to Stream
    await streamClient.upsertUsers([newUser]);

    // Generate token with 1-hour validity
    const validityInSeconds = 60 * 60 * 3600;
    const token = streamClient.generateUserToken({
      user_id: userId,
      validity_in_seconds: validityInSeconds,
    });

    console.log(
      `User ${userId} created with token and validity ${validityInSeconds} seconds`,
    );

    return res.status(200).json({
      token,
      userId,
      apiKey,
    });
  } catch (error) {
    console.error('Error creating Stream user:', error);
    return res.status(500).json({ error: 'Failed to create Stream user' });
  }
});

// Create call endpoint
streamRoute.post('/stream/call', async (req, res) => {
  try {
    const { callId, type = 'default' } = req.body;

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    // Call will be created when first user joins
    return res.status(200).json({
      callId,
      type,
    });
  } catch (error) {
    console.error('Error with call setup:', error);
    return res.status(500).json({ error: 'Failed to setup call' });
  }
});

export default streamRoute;
