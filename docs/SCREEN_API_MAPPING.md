# Screen to API Endpoint Mapping

This document maps Flutter app screens to the corresponding API endpoints. Use this as a reference when implementing screens in your Flutter application.

## Authentication Screens

### Login Screen
- **POST** `/api/auth/login`
  - Email/password login
- **POST** `/api/auth/firebase`
  - Firebase authentication (Google, Facebook, etc.)
- **POST** `/api/auth/refresh-token`
  - Refresh access token

### Registration Screen
- **POST** `/api/auth/register`
  - Create new user account

### Password Reset Screens
- **POST** `/api/auth/forget-password`
  - Request password reset code
- **POST** `/api/auth/verify-code`
  - Verify password reset code
- **POST** `/api/auth/reset-password`
  - Set new password

## Profile Screens

### Artist Profile Screen
- **GET** `/api/user/:id`
  - Get user profile data
- **GET** `/api/artworks?artist=:id`
  - Get artist's artwork
- **POST** `/api/follow/:id`
  - Follow artist
- **DELETE** `/api/follow/:id`
  - Unfollow artist
- **POST** `/api/chat/create`
  - Start chat with artist
- **POST** `/api/special-requests`
  - Create special artwork request

### Edit Profile Screen
- **PUT** `/api/user`
  - Update user profile
- **PUT** `/api/user/profile-image`
  - Update profile image
- **PUT** `/api/user/cover-images`
  - Update cover images

### Settings Screen
- **PUT** `/api/user/settings`
  - Update user settings
- **PUT** `/api/user/notification-settings`
  - Update notification preferences
- **POST** `/api/auth/logout`
  - Logout from current device
- **POST** `/api/auth/logout-all`
  - Logout from all devices

## Home Screen

### Feed
- **GET** `/api/home/feed`
  - Get personalized feed
- **GET** `/api/home/featured`
  - Get featured artworks
- **GET** `/api/home/top-artists`
  - Get top artists
- **GET** `/api/home/categories`
  - Get artwork categories

### Search
- **GET** `/api/artworks/search?q=:query`
  - Search artworks
- **GET** `/api/user/search?q=:query`
  - Search artists/users

## Artwork Screens

### Artwork Details Screen
- **GET** `/api/artworks/:id`
  - Get artwork details
- **POST** `/api/artworks/:id/like`
  - Like artwork
- **POST** `/api/artworks/:id/save`
  - Save artwork to favorites
- **GET** `/api/reviews?artwork=:id`
  - Get artwork reviews
- **POST** `/api/reviews`
  - Add review for artwork
- **POST** `/api/transactions/purchase`
  - Purchase artwork

### Upload Artwork Screen
- **POST** `/api/artworks`
  - Create new artwork
- **POST** `/api/image/upload`
  - Upload artwork images
- **GET** `/api/categories`
  - Get categories for artwork

### Edit Artwork Screen
- **PUT** `/api/artworks/:id`
  - Update artwork details
- **DELETE** `/api/artworks/:id`
  - Delete artwork

## Chat Screens

### Chat List Screen
- **GET** `/api/chat`
  - Get all user chats
- **GET** `/api/chat/unread-count`
  - Get unread message count

### Chat Detail Screen
- **GET** `/api/chat/:id/messages`
  - Get chat messages
- **POST** `/api/chat/:id/messages`
  - Send new message
- **PUT** `/api/chat/:id/read`
  - Mark messages as read
- **POST** `/api/chat/:id/image`
  - Send image in chat

## Special Request Screens

### Create Request Screen
- **POST** `/api/special-requests`
  - Create new special request
- **POST** `/api/image/upload`
  - Upload reference images

### My Requests Screen
- **GET** `/api/special-requests?user=:id`
  - Get user's special requests
- **GET** `/api/special-requests/:id`
  - Get request details
- **PUT** `/api/special-requests/:id/cancel`
  - Cancel request

### Artist Request Screen
- **GET** `/api/special-requests?artist=:id`
  - Get requests for artist
- **PUT** `/api/special-requests/:id/accept`
  - Accept special request
- **PUT** `/api/special-requests/:id/reject`
  - Reject special request
- **PUT** `/api/special-requests/:id/complete`
  - Mark request as completed

## Transaction Screens

### Purchase Screen
- **POST** `/api/transactions/purchase`
  - Purchase artwork
- **GET** `/api/transactions/:id`
  - Get transaction details

### Order History Screen
- **GET** `/api/transactions?user=:id`
  - Get user's purchase history
- **GET** `/api/transactions?artist=:id`
  - Get artist's sales history

### Transaction Detail Screen
- **GET** `/api/transactions/:id`
  - Get transaction details
- **PUT** `/api/transactions/:id/cancel`
  - Cancel transaction (if allowed)

## Notification Screens

### Notifications List Screen
- **GET** `/api/notifications`
  - Get user notifications
- **PUT** `/api/notifications/:id/read`
  - Mark notification as read
- **PUT** `/api/notifications/read-all`
  - Mark all notifications as read

## Favorites/Saved Items Screen

### Favorites Screen
- **GET** `/api/user/favorites`
  - Get user's saved artworks
- **DELETE** `/api/user/favorites/:id`
  - Remove artwork from favorites

## Terms and Conditions Screen
- **GET** `/api/terms`
  - Get terms and conditions

## Report Screen
- **POST** `/api/reports`
  - Submit report for user, artwork, etc.

## App Configuration
- **GET** `/api/app/config`
  - Get app configuration
- **POST** `/api/auth/fcm-token`
  - Register device for push notifications

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "status": 400,
  "message": "حدث خطأ",
  "error": "تفاصيل الخطأ",
  "errorCode": "ERROR_CODE",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

Common error codes:
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `SERVER_ERROR` - Internal server error
- `NETWORK_ERROR` - Network connectivity issues
- `DUPLICATE_ENTITY` - Resource already exists
