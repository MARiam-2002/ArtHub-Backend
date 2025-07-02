# Postman Collection for ArtHub API

This document provides instructions on how to use the Postman collection for testing the ArtHub API endpoints.

## Overview

The ArtHub API Postman collection contains all the endpoints organized by modules, with pre-configured requests and environment variables to make testing easier.

## Getting Started

### 1. Download Postman Collection and Environment

Download the following files from the repository:

- `ArtHub_API.postman_collection.json` - Contains all API requests
- `ArtHub_Environment.postman_environment.json` - Contains environment variables

### 2. Import into Postman

1. Open Postman
2. Click on "Import" button in the top left corner
3. Drag and drop both files or browse to select them
4. Click "Import" to add them to your Postman workspace

### 3. Set Up Environment Variables

1. In Postman, click on the environment dropdown in the top right corner
2. Select "ArtHub_Environment"
3. Update the following variables:
   - `baseUrl`: Your API base URL (e.g., `http://localhost:5000/api` for local development)
   - `token`: Leave empty (will be automatically populated after login)
   - `refreshToken`: Leave empty (will be automatically populated after login)

### 4. Authentication

Before testing protected endpoints, you need to authenticate:

1. Navigate to the "Authentication" folder in the collection
2. Run the "Login" request with valid credentials
3. The response will automatically set the `token` and `refreshToken` variables for subsequent requests

## Collection Structure

The collection is organized by modules to match the backend structure:

- **Authentication**
  - Login
  - Register
  - Refresh Token
  - Forget Password
  - Reset Password
  - Logout

- **Users**
  - Get User Profile
  - Update User Profile
  - Update Profile Image
  - Search Users
  - Follow/Unfollow

- **Artworks**
  - Get All Artworks
  - Get Artwork Details
  - Create Artwork
  - Update Artwork
  - Delete Artwork
  - Like/Unlike Artwork
  - Save/Unsave Artwork

- **Images**
  - Upload Image
  - Delete Image
  - Get Image Details

- **Chat**
  - Get All Chats
  - Get Chat Messages
  - Send Message
  - Mark as Read

- **Notifications**
  - Get All Notifications
  - Mark as Read
  - Mark All as Read

- **Special Requests**
  - Create Special Request
  - Get All Requests
  - Get Request Details
  - Update Request Status

- **Transactions**
  - Create Transaction
  - Get Transaction Details
  - Get User Transactions

## Testing Workflows

### User Registration and Login Flow

1. Run "Register" request with new user details
2. Verify the response contains user data and tokens
3. Run "Logout" request to clear the session
4. Run "Login" request with the same credentials
5. Verify successful authentication

### Artwork Creation Flow

1. Run "Login" as an artist
2. Run "Upload Image" to upload artwork images
3. Run "Create Artwork" with artwork details and image IDs
4. Run "Get Artwork Details" to verify creation

### Chat Flow

1. Run "Login" as a user
2. Run "Create Chat" to start a conversation with an artist
3. Run "Send Message" to send a message
4. Run "Get Chat Messages" to verify the message was sent

## Environment Variables

The collection uses the following environment variables:

| Variable | Description |
|----------|-------------|
| `baseUrl` | Base URL of the API |
| `token` | JWT access token (set automatically after login) |
| `refreshToken` | JWT refresh token (set automatically after login) |
| `userId` | Current user ID (set automatically after login) |
| `artworkId` | ID of the last created/fetched artwork |
| `chatId` | ID of the last created/fetched chat |
| `imageId` | ID of the last uploaded image |

## Request Examples

### Login Request

```json
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create Artwork Request

```json
POST {{baseUrl}}/artworks
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "title": "غروب على النيل",
  "description": "لوحة زيتية تصور غروب الشمس على نهر النيل",
  "price": 1500,
  "currency": "EGP",
  "category": "60d0fe4f5311236168a109cc",
  "images": ["60d0fe4f5311236168a109d0"],
  "tags": ["طبيعة", "نيل", "غروب", "مصر"],
  "dimensions": {
    "width": 60,
    "height": 40,
    "unit": "cm"
  },
  "materials": ["زيت", "قماش كتان"]
}
```

## Automated Tests

The collection includes test scripts for key endpoints to verify:

1. Response status codes
2. Response structure and data types
3. Authentication token validity
4. Error handling

To run all tests:

1. Right-click on the collection
2. Select "Run collection"
3. Configure the run settings
4. Click "Run ArtHub_API"

## Troubleshooting

### Authentication Issues

If you encounter "Unauthorized" errors:

1. Check if your token has expired
2. Run the "Refresh Token" request to get a new token
3. If refresh fails, run "Login" again to get new tokens

### API Connection Issues

If you can't connect to the API:

1. Verify the `baseUrl` environment variable is correct
2. Check if the API server is running
3. Check network connectivity and firewall settings

## Creating Your Own Requests

To create a new request:

1. Right-click on the appropriate folder
2. Select "Add Request"
3. Configure the request with the appropriate method, URL, headers, and body
4. Use environment variables where appropriate (e.g., `{{baseUrl}}`, `{{token}}`)
5. Add tests if needed

## Exporting Updated Collection

After making changes to the collection:

1. Click on the "..." next to the collection name
2. Select "Export"
3. Choose the export format (recommended: Collection v2.1)
4. Save the file and share with your team

## Additional Resources

- [Postman Documentation](https://learning.postman.com/docs/getting-started/introduction/)
- [Writing Postman Tests](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Using Environment Variables](https://learning.postman.com/docs/sending-requests/variables/) 