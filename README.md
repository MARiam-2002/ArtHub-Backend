# ArtHub Backend API

This is the backend API service for the ArtHub application, providing RESTful endpoints for artists and art enthusiasts.

## Features

- User authentication and authorization (JWT & Firebase)
- Image upload and management
- Artwork showcase and discovery
- Artist profiles and following system
- Chat and messaging functionality
- Reviews and ratings
- Wish lists and bookmarks

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- Firebase Authentication integration
- Cloudinary for image storage
- Swagger UI for API documentation
- JWT for authentication
- ESM modules

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB installation or MongoDB Atlas account
- Cloudinary account
- Firebase project (for social login)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=3000
NODE_ENV=development

# MongoDB
DB_URI=mongodb://localhost:27017/arthub
MONGO_URI=mongodb://localhost:27017/arthub

# JWT
TOKEN_KEY=your_secret_jwt_key
SALT_ROUND=8

# Cloudinary
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_DATABASE_URL=your_database_url

# Email (for password reset)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/arthub-backend.git
   cd arthub-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The API will be available at http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

## API Documentation

The API documentation is available through Swagger UI at `/api-docs` when the server is running.

### Main Endpoints

- Authentication: `/auth/*`
- Artwork: `/artworks/*`
- Images: `/image/*`
- Chat: `/chat/*`
- User profiles: `/user/*`
- Reviews: `/reviews/*`
- Categories: `/categories/*`
- Home feed: `/home/*`

## Deployment

### Deploying to Vercel

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

The project includes a `vercel.json` file with proper configuration for serverless deployment.

## Development

### Project Structure

```
├── DB
│   ├── connection.js
│   └── models/
├── src
│   ├── middleware/
│   ├── modules/
│   │   ├── artwork/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── chat/
│   │   ├── follow/
│   │   ├── global/
│   │   ├── home/
│   │   ├── image/
│   │   ├── notification/
│   │   ├── review/
│   │   ├── specialRequest/
│   │   └── user/
│   ├── public/
│   │   └── assets/
│   ├── swagger/
│   └── utils/
├── index.js
└── package.json
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact the development team at:
- Email: support@arthub-app.com 