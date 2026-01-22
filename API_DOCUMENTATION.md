# Diaspora Backend - Complete API Documentation

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Health Check & Test](#1-health-check--test-endpoints)
  - [User Management](#2-user-management)
  - [Preferences](#3-preferences)
  - [Profiles](#4-profiles)
  - [Images](#5-images)
  - [Interests](#6-interests)
  - [Location](#7-location)
  - [Likes](#8-likes)
  - [Dislikes](#9-dislikes)
  - [Matches](#10-matches)
  - [Profile Views](#11-profile-views)
  - [Roulette (Video Chat Matching)](#12-roulette-video-chat-matching)
  - [Reports](#13-reports)
  - [Blocks](#14-blocks)
  - [Boost/Premium Features](#15-boostpremium-features)
  - [Favorites](#16-favorites)
  - [Stream.io (Video/Voice Calls)](#17-streamio-videovoice-calls)
  - [Payments (Stripe)](#18-payments-stripe)
  - [Get Help (Support)](#19-get-help-support)

---

## Overview

This is a Node.js/Express backend for a dating application (Diaspora) built with TypeScript. The API provides comprehensive functionality for user matching, real-time communication, video chat roulette, payments, and user management.

## Technology Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Caching**: Redis
  - User list cache: 2 minutes TTL
  - Interests cache: 1 hour TTL
- **Real-time Communication**: Ably
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Video/Voice Calls**: Stream.io
- **Payments**: Stripe
- **Image Storage**: Cloudinary
- **Validation**: Zod schemas

## Authentication

### Authentication Methods

1. **Clerk Middleware** (`clerkMiddleware()`)
   - Optional authentication
   - Attaches auth data if present
   - Used on most endpoints

2. **Clerk RequireAuth** (`requireAuth()`)
   - Enforces authentication
   - Returns 401 if not authenticated
   - Used on protected endpoints

### Rate Limiting

- `GET /api/v1/users`: 100 requests per 60 seconds

### Custom Middleware

- **checkBlocked**: Filters blocked users from results (used on `/users` endpoint)
- **stripeWebhookMiddleware**: Special handling for Stripe webhook events

## Base URL

```
/api/v1
```

---

## Endpoints

### 1. Health Check & Test Endpoints

#### Health Check
```
GET /api/v1/health
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
{
  "status": 200,
  "message": "Running...",
  "port": "string",
  "isDev": boolean
}
```

**Description**: Basic health check endpoint to verify the server is running.

---

#### Hello/Auth Test
```
GET /api/v1/
```

**Authentication**: Clerk middleware required

**Request**: No parameters

**Response**:
```json
{
  "message": "Running",
  "auth": {
    "userId": "string",
    "sessionId": "string",
    // ... other auth fields
  }
}
```

**Description**: Test endpoint to verify authentication is working.

---

#### Protected Auth Required
```
GET /api/v1/protected-auth-required
```

**Authentication**: Clerk middleware required

**Request**: No parameters

**Response**:
```json
{
  "user": {
    "userId": "string",
    "sessionId": "string"
  },
  "name": "Ben"
}
```

**Description**: Test endpoint with Clerk middleware.

---

#### Protected (Require Auth)
```
GET /api/v1/protected
```

**Authentication**: Clerk requireAuth() enforced

**Request**: No parameters

**Response**:
```json
{
  "data": "object",
  "auth": "object"
}
```

**Description**: Test endpoint with enforced authentication.

---

### 2. User Management

#### Create User
```
POST /api/v1/user
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "clerkId": "string (required)",
  "phone": "string (optional)"
}
```

**Response**:
```json
{
  "id": "string",
  "clerkId": "string",
  "phone": "string | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Creates a new user and automatically creates a default profile. The clerkId should match the Clerk authentication ID.

**Features**:
- Automatically creates associated profile
- Validates clerkId is provided
- Returns created user object

---

#### Update User
```
PATCH /api/v1/user/:id
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `id` (required): User ID to update

**Request Body**:
```json
{
  "clerkId": "string (optional)",
  "phone": "string (optional)"
}
```

**Response**:
```json
{
  "id": "string",
  "clerkId": "string",
  "phone": "string | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Updates an existing user's information.

**Features**:
- Partial updates supported (only include fields to update)
- Validates user exists before updating

---

#### Delete User
```
DELETE /api/v1/user/:id
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `id` (required): User ID to delete

**Request**: No body

**Response**:
- Status Code: 204 No Content

**Description**: Permanently deletes a user and all associated data.

**Features**:
- Cascading deletion of:
  - Roulette sessions
  - Roulette matches
  - Premium features
  - User profile
  - Images
  - Likes (sent and received)
  - Dislikes
  - Matches
  - Profile views
  - Blocks
  - Favorites
  - Reports

---

#### Get User by ID
```
GET /api/v1/user/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): User ID to retrieve

**Request**: No parameters

**Response**:
```json
{
  "id": "string",
  "clerkId": "string",
  "phone": "string | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Error Response** (404):
```json
{
  "error": "User not found"
}
```

**Description**: Retrieves a specific user by their ID.

---

#### Get Users (with Advanced Filtering)
```
GET /api/v1/users
```

**Authentication**: Clerk middleware required

**Rate Limiting**: 100 requests per 60 seconds

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | ID of the requesting user |
| `radius` | string or [number, number] | Yes | Distance range in km (e.g., "50" or "[10, 100]") |
| `age` | string or [number, number] | Yes | Age range (e.g., "25" or "[21, 35]") |
| `gender` | 'man' \| 'woman' \| 'nonbinary' | No | Filter by gender |
| `activity` | 'justJoined' | No | Filter for recently joined users |
| `country` | string | No | Filter by country (converted to uppercase) |
| `ethnicity` | string | No | Filter by ethnicity |
| `zodiac` | string | No | Filter by zodiac sign (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces) |
| `height` | string | No | Filter by height |
| `drinking` | 'true' | No | Filter users who drink |
| `smoking` | 'true' | No | Filter users who smoke |
| `educationLevel` | string | No | Filter by education level |
| `familyPlans` | string | No | Filter by family plans (encoded string) |
| `lookingFor` | string | No | Filter by what they're looking for (encoded string) |
| `minPhotos` | number | No | Minimum number of photos required |
| `hasBio` | 'true' | No | Filter users with bio |

**Response**:
```json
{
  "cache": boolean,
  "users": [
    {
      "id": "string",
      "clerkId": "string",
      "phone": "string | null",
      "profile": {
        "bio": "string",
        "interests": ["string"]
      },
      "images": [
        {
          "imageUrl": "string",
          "order": number
        }
      ],
      "preferences": {
        "gender": "string",
        "ageRange": [number, number],
        // ... other preferences
      },
      "location": {
        "latitude": number,
        "longitude": number,
        "distance": number
      }
    }
  ]
}
```

**Description**: Advanced user search with multiple filters and location-based matching.

**Features**:
- Location-based filtering with distance calculation
- Age range filtering
- Multiple preference filters
- Excludes blocked users (via checkBlocked middleware)
- Redis caching (2-minute TTL)
- Returns cache status in response
- Automatic cache invalidation on user updates

**Error Responses**:
- 400: Missing required parameters
- 400: Invalid parameter format
- 500: Server error

---

#### Update FCM Token
```
PUT /api/v1/fcm-token
```

**Authentication**: None required

**Request Body**:
```json
{
  "fcmToken": "string (required)",
  "userId": "string (required)"
}
```

**Response**:
```json
{
  "message": "Token updated successfully"
}
```

**Description**: Updates or creates a user's Firebase Cloud Messaging token for push notifications.

**Features**:
- Upsert operation (updates if exists, creates if not)
- Used for sending push notifications

---

#### Update Stream Token
```
PATCH /api/v1/user/stream/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): User ID

**Request Body**:
```json
{
  "streamToken": "string (required)"
}
```

**Response**:
```json
{
  "message": "string (the streamToken)"
}
```

**Description**: Updates a user's Stream.io token.

---

### 3. Preferences

#### Create Preference
```
POST /api/v1/preference
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "userId": "string (required)",
  "lookingToDate": "string (required)"
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "lookingToDate": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Creates user preferences for dating criteria.

---

#### Update Preference
```
PATCH /api/v1/preference/:id/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `id` (required): Preference ID
- `userId` (required): User ID

**Request Body** (all fields optional):
```json
{
  "lookingToDate": "string",
  "ageRange": [number, number],
  "maxDistance": number,
  "gender": "string",
  "interests": ["string"],
  "height": "string",
  "ethnicity": "string",
  "zodiac": "string",
  "educationLevel": "string",
  "drinking": boolean,
  "smoking": boolean,
  "familyPlans": "string",
  "lookingFor": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  // ... updated preference fields
  "updatedAt": "timestamp"
}
```

**Description**: Updates user preferences. Only include fields you want to update.

---

#### Get Preference
```
GET /api/v1/preference/:id
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `id` (required): Preference ID

**Request**: No parameters

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "lookingToDate": "string",
  // ... all preference fields
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Error Response** (404):
```json
{
  "error": "Preference not found"
}
```

**Description**: Retrieves a specific preference by ID.

---

### 4. Profiles

#### Create Profile
```
POST /api/v1/profile
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)",
  "bio": "string (required)",
  "interests": ["string (required, array of interests)"]
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "bio": "string",
  "interests": ["string"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Creates a user profile with bio and interests.

---

#### Get Profile
```
GET /api/v1/profile/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "bio": "string",
  "interests": ["string"],
  "user": {
    "id": "string",
    "clerkId": "string",
    "phone": "string | null"
  },
  "preferences": {
    // ... preference object
  },
  "images": [
    {
      "imageUrl": "string",
      "order": number
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Retrieves a complete profile with joined user data, preferences, and images.

---

#### Update Profile
```
PUT /api/v1/profile/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request Body** (all fields optional):
```json
{
  "bio": "string",
  "interests": ["string"]
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "bio": "string",
  "interests": ["string"],
  "updatedAt": "timestamp"
}
```

**Description**: Updates profile bio and/or interests.

---

#### Delete Profile
```
DELETE /api/v1/profile/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No body

**Response**:
```json
{
  "success": true
}
```

**Description**: Deletes a user's profile.

---

### 5. Images

#### Get Cloudinary Upload Credentials
```
GET /api/v1/image/upload-url
```

**Authentication**: Clerk middleware required

**Request**: No parameters

**Response**:
```json
{
  "cloudName": "string",
  "apiKey": "string",
  "timestamp": number,
  "signature": "string",
  "folder": "string",
  "upload_preset": "string"
}
```

**Description**: Returns Cloudinary credentials for direct client-side image uploads.

**Features**:
- Generates signed upload credentials
- Returns upload preset and folder configuration
- Credentials are time-stamped for security

---

#### Save User Images
```
POST /api/v1/images
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "userId": "string (required)",
  "images": [
    {
      "imageUrl": "string (required)",
      "order": number (optional)
    }
  ]
}
```

**Response**:
```json
[
  {
    "id": "string",
    "userId": "string",
    "imageUrl": "string",
    "order": number,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

**Description**: Creates or updates user images with specific ordering.

**Features**:
- Upsert operation based on order position
- Automatically manages image ordering
- Returns all processed images

---

### 6. Interests

#### Get All Interests
```
GET /api/v1/interests
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
{
  "cache": boolean,
  "interests": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "createdAt": "timestamp"
    }
  ]
}
```

**Description**: Retrieves list of all available interests.

**Features**:
- Redis caching with 1-hour TTL
- Returns cache status in response
- Used for profile interest selection

---

### 7. Location

#### Create/Update Location
```
POST /api/v1/location
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "userId": "string (required)",
  "latitude": number (required),
  "longitude": number (required)
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "latitude": number,
  "longitude": number,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Updates user's location coordinates.

**Features**:
- Used for distance-based matching
- Location is used in the `/users` endpoint for proximity filtering

---

### 8. Likes

#### Create Like
```
POST /api/v1/likes
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "likerId": "string (required)",
  "likedId": "string (required)",
  "superLike": boolean (optional, default: false)
}
```

**Response (no mutual match)**:
```json
{
  "like": {
    "id": "string",
    "likerId": "string",
    "likedId": "string",
    "superLike": boolean,
    "createdAt": "timestamp"
  }
}
```

**Response (mutual match created)**:
```json
{
  "like": {
    "id": "string",
    "likerId": "string",
    "likedId": "string",
    "superLike": boolean,
    "createdAt": "timestamp"
  },
  "match": {
    "id": "string",
    "user1Id": "string",
    "user2Id": "string",
    "createdAt": "timestamp"
  }
}
```

**Description**: Creates a like from one user to another.

**Features**:
- Validates both users exist
- Sends FCM push notification to liked user
- Automatically creates match if both users like each other
- Supports super likes
- Prevents duplicate likes

**Error Responses**:
- 400: User not found
- 400: Duplicate like

---

#### Get Sent Likes
```
GET /api/v1/likes/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): ID of the user who sent the likes

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string",
    "likerId": "string",
    "likedId": "string",
    "superLike": boolean,
    "likedUser": {
      "id": "string",
      "clerkId": "string",
      "phone": "string | null",
      "profile": {
        "bio": "string",
        "interests": ["string"]
      },
      "images": [
        {
          "imageUrl": "string",
          "order": number
        }
      ]
    },
    "createdAt": "timestamp"
  }
]
```

**Description**: Retrieves all users that the specified user has liked.

**Features**:
- Includes full user profiles with images
- Ordered by creation date

---

#### Get Received Likes
```
GET /api/v1/likes/received/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): ID of the user who received the likes

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string",
    "likerId": "string",
    "likedId": "string",
    "superLike": boolean,
    "liker": {
      "id": "string",
      "clerkId": "string",
      "phone": "string | null",
      "profile": {
        "bio": "string",
        "interests": ["string"]
      },
      "images": [
        {
          "imageUrl": "string",
          "order": number
        }
      ]
    },
    "createdAt": "timestamp"
  }
]
```

**Description**: Retrieves all users who have liked the specified user.

**Features**:
- Includes full liker profiles with images
- Ordered by creation date
- Shows super likes

---

### 9. Dislikes

#### Create Dislike
```
POST /api/v1/dislikes
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "dislikerId": "string (required)",
  "dislikedId": "string (required)"
}
```

**Response**:
```json
{
  "id": "string",
  "dislikerId": "string",
  "dislikedId": "string",
  "createdAt": "timestamp"
}
```

**Description**: Creates a dislike from one user to another.

**Features**:
- Validates both users exist
- Prevents duplicate dislikes
- Prevents self-dislikes
- Used to filter out users from future recommendations

**Error Responses**:
- 400: User not found
- 400: Duplicate dislike
- 400: Cannot dislike yourself

---

### 10. Matches

#### Get User Matches
```
GET /api/v1/matches/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response**:
```json
{
  "matches": [
    {
      "id": "string",
      "user1Id": "string",
      "user2Id": "string",
      "matchedUser": {
        "id": "string",
        "clerkId": "string",
        "phone": "string | null",
        "profile": {
          "bio": "string",
          "interests": ["string"]
        },
        "images": [
          {
            "imageUrl": "string",
            "order": number
          }
        ]
      },
      "createdAt": "timestamp"
    }
  ]
}
```

**Description**: Retrieves all matches for a user with full profile details.

**Features**:
- Returns both user1-user2 and user2-user1 matches
- Includes full matched user profiles
- Ordered by match creation date

---

### 11. Profile Views

#### Create Profile View
```
POST /api/v1/profile-views
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "viewerId": "string (required)",
  "viewedId": "string (required)"
}
```

**Response**:
```json
{
  "id": "string",
  "viewerId": "string",
  "viewedId": "string",
  "seen": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Records a profile view from one user to another.

**Features**:
- Upsert operation (prevents duplicate view entries)
- Sends Ably real-time notification to viewed user
- Prevents self-views
- Updates timestamp on repeated views

**Error Responses**:
- 400: Cannot view your own profile

---

#### Get Profile Views
```
GET /api/v1/profile-views/:userId
```

**Authentication**: Clerk middleware required

**URL Parameters**:
- `userId` (required): User ID whose profile was viewed

**Query Parameters**:
- `limit` (optional, default: 20): Number of results to return
- `offset` (optional, default: 0): Pagination offset
- `markAsSeen` (optional): Set to 'true' to mark views as read

**Request**: Query parameters only

**Response**:
```json
[
  {
    "id": "string",
    "viewerId": "string",
    "viewedId": "string",
    "seen": boolean,
    "viewer": {
      "id": "string",
      "clerkId": "string",
      "phone": "string | null",
      "profile": {
        "bio": "string",
        "interests": ["string"]
      },
      "images": [
        {
          "imageUrl": "string",
          "order": number
        }
      ]
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

**Description**: Retrieves users who viewed the specified user's profile.

**Features**:
- De-duplicated by viewer (shows each viewer once)
- Supports pagination
- Can mark views as seen
- Includes full viewer profiles with images
- Ordered by most recent view

---

#### Cleanup Old Profile Views
```
DELETE /api/v1/profile-views
```

**Authentication**: Clerk middleware required

**Request**: No parameters

**Response**:
```json
{
  "deletedCount": number
}
```

**Description**: Deletes profile views older than 7 days.

**Features**:
- Automatic cleanup of old data
- Returns count of deleted records
- Should be called periodically (e.g., via cron job)

---

### 12. Roulette (Video Chat Matching)

#### Start Roulette Matching
```
POST /api/v1/roulette/start
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)"
}
```

**Response (successfully matched)**:
```json
{
  "success": true,
  "matched": true,
  "roomId": "string",
  "partnerId": "string",
  "matchId": "string",
  "endsAt": "timestamp"
}
```

**Response (waiting for match)**:
```json
{
  "success": true,
  "matched": false,
  "message": "Searching for a match..."
}
```

**Response (already in a match)** - Status 409:
```json
{
  "success": false,
  "error": "already_matched",
  "matchDetails": {
    "matchId": "string",
    "roomId": "string",
    "endsAt": "timestamp"
  },
  "partnerId": "string"
}
```

**Description**: Starts the roulette matching process to find a random video chat partner.

**Features**:
- Creates session with 5-minute duration
- Matches with waiting users or creates waiting session
- Generates unique room IDs for matched pairs
- Prevents duplicate matching
- Automatic session expiration

**Error Responses**:
- 409: User already in an active match
- 400: User not found
- 500: Server error

---

#### Get Roulette Details
```
GET /api/v1/roulette/details/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response (has session)**:
```json
{
  "success": true,
  "exists": true,
  "session": {
    "id": "string",
    "userId": "string",
    "status": "waiting" | "matched" | "ended",
    "createdAt": "timestamp",
    "endsAt": "timestamp"
  },
  "match": {
    "id": "string",
    "roomId": "string",
    "user1Id": "string",
    "user2Id": "string",
    "startedAt": "timestamp",
    "endsAt": "timestamp"
  }
}
```

**Response (no session)**:
```json
{
  "success": true,
  "exists": false,
  "session": null
}
```

**Description**: Gets roulette session details without modifying state.

---

#### End Roulette Match
```
POST /api/v1/roulette/end
```

**Authentication**: None required

**Request Body**:
```json
{
  "matchId": "string (optional)",
  "userId": "string (optional)"
}
```

**Note**: Provide either matchId or userId

**Response**:
```json
{
  "success": true,
  "message": "Match ended successfully"
}
```

**Description**: Ends an active roulette match.

**Features**:
- Can end by matchId or userId
- Updates session status to 'ended'
- Cleans up match data

---

#### Get Roulette Status
```
GET /api/v1/roulette/status/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response (active match)**:
```json
{
  "success": true,
  "exists": true,
  "session": {
    "id": "string",
    "userId": "string",
    "status": "matched",
    "createdAt": "timestamp",
    "endsAt": "timestamp"
  },
  "statusMessage": "In a match - 3:45 remaining",
  "match": {
    "id": "string",
    "roomId": "string",
    "user1Id": "string",
    "user2Id": "string",
    "partner": {
      "id": "string",
      "clerkId": "string",
      "profile": {
        "bio": "string"
      },
      "images": [...]
    },
    "startedAt": "timestamp",
    "endsAt": "timestamp",
    "timeRemaining": "3:45",
    "progress": 25
  }
}
```

**Response (waiting)**:
```json
{
  "success": true,
  "exists": true,
  "session": {
    "status": "waiting",
    // ... other fields
  },
  "statusMessage": "Searching for a match..."
}
```

**Description**: Gets detailed status including time remaining and progress.

**Features**:
- Includes time remaining in human-readable format
- Progress percentage (0-100)
- Partner details if matched
- Status message

---

#### Cancel Roulette Search/Match
```
POST /api/v1/roulette/cancel
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)"
}
```

**Response (cancelled waiting)**:
```json
{
  "success": true,
  "action": "waiting_cancelled",
  "message": "Search cancelled"
}
```

**Response (ended match)**:
```json
{
  "success": true,
  "action": "match_ended",
  "message": "Match ended successfully"
}
```

**Response (no session)**:
```json
{
  "success": false,
  "action": "no_session",
  "message": "No active session found"
}
```

**Description**: Cancels waiting search or ends active match.

**Features**:
- Handles both waiting and matched states
- Returns action taken

---

#### Get Roulette History
```
GET /api/v1/roulette/history/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Query Parameters**:
- `limit` (optional, default: 20): Number of history items to return

**Request**: Query parameters only

**Response**:
```json
{
  "success": true,
  "history": [
    {
      "id": "string",
      "roomId": "string",
      "partnerId": "string",
      "partner": {
        "id": "string",
        "clerkId": "string",
        "profile": {
          "bio": "string"
        },
        "images": [...]
      },
      "startedAt": "timestamp",
      "endedAt": "timestamp",
      "duration": "5:00",
      "formattedDate": "Dec 19, 2025 at 3:45 PM"
    }
  ]
}
```

**Description**: Retrieves user's roulette match history.

**Features**:
- Formatted duration (MM:SS)
- Formatted date
- Partner details
- Ordered by most recent

---

#### Cleanup Expired Matches
```
POST /api/v1/roulette/cleanup
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
{
  "success": true,
  "sessionsUpdated": number,
  "matchesProcessed": number,
  "expiredSessionsEnded": number,
  "expiredMatchesEnded": number
}
```

**Description**: Removes expired roulette sessions and matches.

**Features**:
- Should be called periodically (cron job)
- Updates expired sessions to 'ended'
- Returns cleanup statistics

---

#### Get Roulette Statistics
```
GET /api/v1/roulette/stats
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
{
  "success": true,
  "stats": {
    "activeUsers": number,
    "waitingUsers": number,
    "activeMatches": number,
    "matchesLast24h": number,
    "avgMatchDurationMs": number,
    "timestamp": "timestamp"
  }
}
```

**Description**: Retrieves real-time roulette system statistics.

**Features**:
- Active and waiting user counts
- Active match count
- 24-hour match count
- Average match duration

---

### 13. Reports

#### Create Report
```
POST /api/v1/report
```

**Authentication**: None required

**Request Body**:
```json
{
  "reporterId": "string (required)",
  "reportedId": "string (required)",
  "reason": "string (required)",
  "details": "string (optional)"
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "string (UUID)",
    "reporterId": "string",
    "reportedId": "string",
    "reason": "string",
    "details": "string | null",
    "status": "pending",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Description**: Creates a report for inappropriate user behavior.

**Features**:
- Prevents self-reporting
- Generates UUID for report ID
- Default status: 'pending'

**Error Responses**:
- 400: Cannot report yourself

---

#### Get All Reports
```
GET /api/v1/reports
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string",
    "reporterId": "string",
    "reportedId": "string",
    "reason": "string",
    "details": "string | null",
    "status": "pending" | "reviewed" | "resolved" | "dismissed",
    "reporter": {
      "id": "string",
      "clerkId": "string",
      "profile": {...}
    },
    "reported": {
      "id": "string",
      "clerkId": "string",
      "profile": {...}
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

**Description**: Retrieves all reports with reporter and reported user details.

---

#### Update Report Status
```
PATCH /api/v1/report/:id
```

**Authentication**: None required

**URL Parameters**:
- `id` (required): Report ID

**Request Body**:
```json
{
  "status": "reviewed" | "resolved" | "dismissed" (required)
}
```

**Response**:
```json
{
  "id": "string",
  "reporterId": "string",
  "reportedId": "string",
  "reason": "string",
  "details": "string | null",
  "status": "string",
  "updatedAt": "timestamp"
}
```

**Description**: Updates the status of a report (for admin/moderation).

---

### 14. Blocks

#### Block User
```
POST /api/v1/block
```

**Authentication**: None required

**Request Body**:
```json
{
  "blockerId": "string (required)",
  "blockedId": "string (required)"
}
```

**Response**:
```json
{
  "success": true,
  "block": {
    "id": "string",
    "blockerId": "string",
    "blockedId": "string",
    "createdAt": "timestamp"
  }
}
```

**Description**: Blocks a user from appearing in searches and interactions.

**Features**:
- Prevents self-blocking
- Prevents duplicate blocks
- Invalidates blocker's user cache after blocking
- Blocked users filtered from `/users` endpoint

**Error Responses**:
- 400: Cannot block yourself
- 400: User already blocked

---

### 15. Boost/Premium Features

#### Activate Visibility Boost
```
POST /api/v1/boost/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID to boost

**Request**: No parameters

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "boostActive": true,
  "boostExpiresAt": "timestamp (24 hours from now)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Description**: Activates a 24-hour visibility boost for the user.

**Features**:
- Sets boost active for 24 hours
- Creates premium features entry if doesn't exist
- Updates existing boost if present
- Invalidates user cache after update

---

### 16. Favorites

#### Add Favorite
```
POST /api/v1/favorites
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)",
  "favoriteUserId": "string (required)"
}
```

**Response**:
```json
{
  "id": "string",
  "userId": "string",
  "favoriteUserId": "string",
  "createdAt": "timestamp"
}
```

**Description**: Adds a user to favorites list.

**Features**:
- Prevents duplicate favorites
- Validates both users exist

**Error Responses**:
- 400: User not found
- 400: Already favorited

---

#### Remove Favorite
```
DELETE /api/v1/favorites/:userId/:favoriteUserId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User who favorited
- `favoriteUserId` (required): User to unfavorite

**Request**: No body

**Response**:
```json
{
  "success": true
}
```

**Description**: Removes a user from favorites list.

---

#### Get User Favorites
```
GET /api/v1/favorites/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string",
    "userId": "string",
    "favoriteUserId": "string",
    "favoriteUser": {
      "id": "string",
      "clerkId": "string",
      "phone": "string | null",
      "profile": {
        "bio": "string",
        "interests": ["string"]
      },
      "images": [
        {
          "imageUrl": "string",
          "order": number
        }
      ]
    },
    "createdAt": "timestamp"
  }
]
```

**Description**: Retrieves user's favorited users with full profiles.

---

### 17. Stream.io (Video/Voice Calls)

#### Generate Stream Token
```
POST /api/v1/stream/token
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)",
  "name": "string (optional)",
  "image": "string (optional)",
  "email": "string (optional)"
}
```

**Response**:
```json
{
  "token": "string",
  "userId": "string",
  "apiKey": "string"
}
```

**Description**: Generates a Stream.io token for video/voice calls.

**Features**:
- Upserts user to Stream.io
- Generates token with 10-year validity
- Updates user profile on Stream if exists

---

#### Create Call
```
POST /api/v1/stream/call
```

**Authentication**: None required

**Request Body**:
```json
{
  "callId": "string (required)",
  "type": "string (optional, default: 'default')"
}
```

**Response**:
```json
{
  "callId": "string",
  "type": "string"
}
```

**Description**: Creates a Stream.io call instance.

---

### 18. Payments (Stripe)

#### Stripe Webhook
```
POST /api/v1/webhook
```

**Authentication**: Stripe signature verification

**Special Handling**: Uses custom JSON middleware (stripeWebhookMiddleware)

**Request**: Raw webhook payload from Stripe

**Description**: Handles Stripe webhook events for payment processing.

**Features**:
- Signature verification
- Handles subscription events
- Updates payment status

---

#### Get Subscription Plans
```
GET /api/v1/plans
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string (price ID)",
    "product": "string (product ID)",
    "unit_amount": number,
    "currency": "string",
    "recurring": {
      "interval": "month" | "year",
      "interval_count": number
    },
    "metadata": {
      "feature1": "value",
      "feature2": "value"
    }
  }
]
```

**Description**: Retrieves all Stripe subscription plans filtered for "Diaspora".

**Features**:
- Filters for active plans
- Returns plan metadata and pricing

---

#### Get or Create Stripe Customer
```
POST /api/v1/customer
```

**Authentication**: Clerk middleware required

**Request Body**:
```json
{
  "userId": "string (required)",
  "email": "string (required)"
}
```

**Response**:
```json
{
  "customerId": "string (Stripe customer ID)",
  "isNew": boolean
}
```

**Description**: Gets existing Stripe customer or creates a new one.

**Features**:
- Checks if customer exists
- Creates new customer if not found
- Stores customer ID in database

---

#### Get Customer ID
```
GET /api/v1/customer/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response**:
```json
{
  "customerId": "string"
}
```

**Error Response** (404):
```json
{
  "error": "Customer not found"
}
```

**Description**: Retrieves Stripe customer ID for a user.

---

#### Create Subscription
```
POST /api/v1/subscription
```

**Authentication**: None required

**Request Body**:
```json
{
  "userId": "string (required)",
  "priceId": "string (required, Stripe price ID)"
}
```

**Response**:
```json
{
  "subscriptionId": "string",
  "clientSecret": "string"
}
```

**Description**: Creates a Stripe subscription for a user.

**Features**:
- Creates subscription with payment intent
- Returns client secret for frontend payment confirmation
- Requires existing Stripe customer

**Error Responses**:
- 404: Customer not found
- 400: Invalid price ID

---

#### Get Subscription Status
```
GET /api/v1/status/:userId
```

**Authentication**: None required

**URL Parameters**:
- `userId` (required): User ID

**Request**: No parameters

**Response**:
```json
{
  "subscriptionType": "free" | "premium" | "gold",
  "paymentStatus": "active" | "canceled" | "past_due" | "trialing" | "none",
  "nextBillingDate": "timestamp | null"
}
```

**Description**: Gets user's subscription status and billing information.

**Features**:
- Returns subscription tier
- Current payment status
- Next billing date

---

### 19. Get Help (Support)

#### Get All Help Requests
```
GET /api/v1/get-help
```

**Authentication**: None required

**Request**: No parameters

**Response**:
```json
[
  {
    "id": "string",
    "email": "string",
    "message": "string",
    "screenshot": "string | null",
    "createdAt": "timestamp"
  }
]
```

**Description**: Retrieves all support/help requests.

---

#### Submit Help Request
```
POST /api/v1/get-help
```

**Authentication**: None required

**Request Body**:
```json
{
  "email": "string (required)",
  "message": "string (required)",
  "screenshot": "string (optional, image URL)"
}
```

**Response**:
```json
{
  "success": true,
  "help": {
    "id": "string",
    "email": "string",
    "message": "string",
    "screenshot": "string | null",
    "createdAt": "timestamp"
  }
}
```

**Description**: Submits a support/feedback request.

**Features**:
- Validates email and message are required
- Optional screenshot attachment
- Creates support ticket

**Error Responses**:
- 400: Email and message are required

---

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Validation error or missing required fields |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource or state conflict |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

---

## Error Response Format

All errors follow this general format:

```json
{
  "error": "Error message describing what went wrong",
  "details": "Optional additional details"
}
```

---

## Caching Strategy

### Redis Cache

1. **User List** (`/api/v1/users`)
   - TTL: 2 minutes
   - Invalidated on: User update, block creation, boost activation

2. **Interests** (`/api/v1/interests`)
   - TTL: 1 hour
   - Static data, rarely changes

### Cache Indicators

Cached responses include a `cache` boolean field:
```json
{
  "cache": true,
  "data": [...]
}
```

---

## Real-time Features

### Ably Integration

**Profile Views**:
- Channel: `profile-views:${viewedId}`
- Event: New profile view notification
- Payload: Viewer details

### FCM Push Notifications

**Likes**:
- Sent when a user receives a like
- Includes liker's name and profile

---

## Security Features

1. **Clerk Authentication**: Protects sensitive endpoints
2. **Rate Limiting**: Prevents abuse on search endpoints
3. **Input Validation**: Zod schemas on all endpoints
4. **SQL Injection Protection**: Drizzle ORM parameterized queries
5. **XSS Protection**: Input sanitization
6. **Stripe Webhook Verification**: Signature validation
7. **Self-Action Prevention**: Users can't like/block/report themselves

---

## Database Cascade Deletions

When a user is deleted (`DELETE /api/v1/user/:id`), the following are automatically removed:
- User profile
- User images
- User preferences
- User location
- Likes (sent and received)
- Dislikes
- Matches
- Profile views (as viewer and viewed)
- Blocks (as blocker and blocked)
- Favorites
- Reports (as reporter and reported)
- Roulette sessions
- Roulette matches
- Premium features
- FCM tokens

---

## Recommended Implementation Flow

### User Onboarding
1. `POST /api/v1/user` - Create user
2. `POST /api/v1/profile` - Create profile
3. `POST /api/v1/preference` - Set preferences
4. `POST /api/v1/images` - Upload photos
5. `POST /api/v1/location` - Set location
6. `PUT /api/v1/fcm-token` - Enable notifications

### User Discovery
1. `GET /api/v1/users` - Get potential matches
2. `POST /api/v1/profile-views` - Track profile view
3. `POST /api/v1/likes` or `POST /api/v1/dislikes` - React to profile
4. `GET /api/v1/matches` - View mutual matches

### Messaging/Calls
1. `POST /api/v1/stream/token` - Get Stream.io token
2. `POST /api/v1/stream/call` - Initiate call

### Roulette
1. `POST /api/v1/roulette/start` - Start matching
2. `GET /api/v1/roulette/status/:userId` - Check status
3. `POST /api/v1/roulette/end` - End session

### Premium Features
1. `GET /api/v1/plans` - View subscription plans
2. `POST /api/v1/customer` - Create Stripe customer
3. `POST /api/v1/subscription` - Subscribe
4. `POST /api/v1/boost/:userId` - Activate boost

---

## Notes

- All timestamps are in ISO 8601 format
- All IDs are UUIDs unless otherwise specified
- Distance calculations use Haversine formula
- Location coordinates use standard latitude/longitude
- Image URLs should be HTTPS Cloudinary URLs
- Clerk user IDs should match across authentication and user creation

---

## Support

For issues or questions:
- Submit via `POST /api/v1/get-help`
- Include detailed description and optional screenshot

---

**Last Updated**: 2025-12-19
**API Version**: v1
