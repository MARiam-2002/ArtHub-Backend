# ArtHub Backend API

This is the backend API service for the ArtHub application, providing RESTful endpoints for artists and art enthusiasts.

## Features

- User authentication and authorization (JWT & Firebase)
- Image upload and management with Cloudinary
- Artwork showcase and discovery
- Artist profiles and following system
- Chat and messaging functionality
- Reviews and ratings
- Special requests and transactions
- Notifications system

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- Firebase Authentication integration
- Cloudinary for image storage
- Swagger UI for API documentation
- JWT for authentication
- ESM modules
- Jest for testing

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
CONNECTION_URL=mongodb://localhost:27017/arthub

# MongoDB Connection Options
MONGODB_CONNECTION_TIMEOUT=30000
MONGODB_SOCKET_TIMEOUT=60000
MONGODB_SERVER_SELECTION_TIMEOUT=30000
MONGODB_MAX_RETRY_ATTEMPTS=5
MONGODB_BASE_RETRY_DELAY=1000

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

- Authentication: `/api/auth/*`
- Artwork: `/api/artworks/*`
- Images: `/api/image/*`
- Chat: `/api/chat/*`
- User profiles: `/api/user/*`
- Reviews: `/api/reviews/*`
- Follow: `/api/follow/*`
- Home feed: `/api/home/*`
- Special requests: `/api/special-requests/*`
- Notifications: `/api/notifications/*`
- Reports: `/api/reports/*`
- Transactions: `/api/transactions/*`

## Code Structure

The project follows a modular architecture with clear separation of concerns:

```
├── DB                     # Database connection and models
│   ├── connection.js      # MongoDB connection setup
│   └── models/            # Mongoose models
├── src
│   ├── middleware/        # Express middleware
│   │   ├── authentication.middleware.js  # JWT authentication
│   │   ├── authorization.middleware.js   # Role-based access control
│   │   ├── error.middleware.js           # Global error handler
│   │   └── validation.middleware.js      # Request validation
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication module
│   │   │   ├── auth.router.js
│   │   │   ├── auth.validation.js
│   │   │   └── controller/
│   │   │       └── auth.js
│   │   ├── artwork/       # Artwork module
│   │   ├── chat/          # Chat module
│   │   └── ...            # Other feature modules
│   ├── utils/             # Utility functions
│   │   ├── asyncHandler.js    # Async error handling
│   │   ├── cloudinary.js      # Image upload utilities
│   │   ├── mongodbUtils.js    # MongoDB utilities
│   │   └── ...
│   └── swagger/           # API documentation
├── __tests__              # Test files
│   ├── unit/              # Unit tests
│   │   ├── auth.test.js
│   │   ├── middleware.test.js
│   │   └── ...
│   └── integration/       # Integration tests
├── index.js               # Application entry point
└── package.json           # Project dependencies and scripts
```

### Clean Code Principles

This codebase follows these clean code principles:

1. **Single Responsibility Principle**: Each module, file, and function has a single responsibility.
2. **Consistent Error Handling**: Centralized error handling with the `asyncHandler` utility.
3. **Middleware Modularity**: Authentication, authorization, and validation are separated into reusable middleware.
4. **Dependency Injection**: Services and utilities are designed for easy testing and mocking.
5. **Consistent Naming**: Clear and consistent naming conventions across the codebase.
6. **Documentation**: JSDoc comments for functions and comprehensive API documentation.
7. **Validation**: Input validation at the controller level with clear error messages.

## Testing

The project includes a comprehensive test suite built with Jest:

### Unit Tests

Unit tests focus on testing individual components in isolation, mocking external dependencies. They are located in the `__tests__/unit/` directory and include tests for:

- **Auth Controller**: Tests for user registration, login, password reset, and social login
- **User Controller**: Tests for profile management, password changes, and user statistics
- **Artwork Controller**: Tests for creating, retrieving, updating, and deleting artwork
- **Chat Controller**: Tests for chat creation and messaging functionality
- **Image Controller**: Tests for image upload and management
- **Notification Controller**: Tests for notification management
- **Middleware**: Tests for authentication, authorization, and validation middleware
- **Utils**: Tests for utility functions like asyncHandler and validation helpers

To run the unit tests:

```bash
npm run test:unit
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly. They are located in the `__tests__/integration/` directory.

To run the integration tests:

```bash
npm run test:integration
```

To run all tests:

```bash
npm test
```

### Test Coverage

To generate a test coverage report:

```bash
npm run test:coverage
```

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

## MongoDB Connection Troubleshooting

If you're experiencing 503 Service Unavailable errors with database connection issues, follow these steps:

### For Local Development

1. **Check your .env file**:

   ```
   CONNECTION_URL=mongodb+srv://username:password@cluster.mongodb.net/arthubdb?retryWrites=true&w=majority
   ```

   Make sure to replace with your actual MongoDB Atlas credentials.

2. **Verify MongoDB Atlas settings**:
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Check that your database user has the correct permissions
   - Verify the cluster is active and running

3. **Test connection directly**:
   ```bash
   node -e "const mongoose = require('mongoose'); mongoose.connect('your_connection_string').then(() => console.log('Connected')).catch(err => console.error(err))"
   ```

### For Vercel Deployment

1. **Set environment variables in Vercel**:
   - Go to your project dashboard in Vercel
   - Navigate to Settings > Environment Variables
   - Add `CONNECTION_URL` with your MongoDB connection string
   - Ensure all other required environment variables are set

2. **Optimize for serverless**:
   - In Vercel, set function duration to at least 30 seconds:
     ```json
     // vercel.json
     "functions": {
       "index.js": {
         "memory": 1024,
         "maxDuration": 30
       }
     }
     ```

3. **Keep functions warm**:
   - Set up a cron job to ping your API every 5 minutes
   - Use a service like [cron-job.org](https://cron-job.org) to call your `/api/keepalive` endpoint

For more detailed troubleshooting, see [MONGODB_TROUBLESHOOTING.md](./docs/MONGODB_TROUBLESHOOTING.md)

## Documentation

The project includes comprehensive documentation in the `docs` directory:

- `CLIENT_INTEGRATION.md`: Guide for integrating client applications with the API
- `FLUTTER_INTEGRATION.md`: Specific instructions for Flutter client integration
- `IMPROVEMENTS.md`: List of implemented improvements and future recommendations
- `MONGODB_TROUBLESHOOTING.md`: Guide for troubleshooting MongoDB connection issues
- `SCREEN_API_MAPPING.md`: Mapping between frontend screens and API endpoints
- `SOCKET_CHAT.md`: Documentation for the Socket.io chat implementation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact the development team at:

- Email: support@arthub-app.com

## نشر المشروع على Vercel

لنشر المشروع على Vercel، اتبع الخطوات التالية:

1. تأكد من أن تغييرات كودك محفوظة على GitHub
2. قم بإنشاء حساب على [Vercel](https://vercel.com) إذا لم يكن لديك حساب بالفعل
3. انتقل إلى لوحة التحكم في Vercel واضغط على "New Project"
4. اختر المستودع الذي يحتوي على مشروع ArtHub
5. في صفحة إعداد المشروع، قم بإضافة المتغيرات البيئية التالية:

### المتغيرات البيئية المطلوبة في Vercel

```
PORT=3000
NODE_ENV=production
CONNECTION_URL=mongodb+srv://username:password@cluster.mongodb.net/artHub?retryWrites=true&w=majority
TOKEN_KEY=your_jwt_secret_key
SALT_ROUND=8
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

6. اضغط على "Deploy" للبدء في عملية النشر
7. بعد اكتمال النشر، سيتم توفير رابط لتطبيقك مثل `https://your-app-name.vercel.app`

### ملاحظات هامة للنشر:

- تأكد من استبدال القيم الموجودة أعلاه بالقيم الفعلية لبيئة الإنتاج الخاصة بك
- للـ `FIREBASE_PRIVATE_KEY`، قم بنسخ المفتاح الخاص بأكمله مع علامات الاقتباس
- تأكد من أن قاعدة بيانات MongoDB يمكن الوصول إليها من الإنترنت (أي أنها مستضافة على Atlas أو خدمة مماثلة)
- إذا واجهت أي مشاكل في النشر، تحقق من سجلات Vercel للحصول على معلومات حول الأخطاء

## MongoDB Connection Troubleshooting

If you're experiencing 503 Service Unavailable errors with database connection issues, follow these steps:

### For Local Development

1. **Check your .env file**:

   ```
   CONNECTION_URL=mongodb+srv://username:password@cluster.mongodb.net/arthubdb?retryWrites=true&w=majority
   ```

   Make sure to replace with your actual MongoDB Atlas credentials.

2. **Verify MongoDB Atlas settings**:
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Check that your database user has the correct permissions
   - Verify the cluster is active and running

3. **Test connection directly**:
   ```bash
   node -e "const mongoose = require('mongoose'); mongoose.connect('your_connection_string').then(() => console.log('Connected')).catch(err => console.error(err))"
   ```

### For Vercel Deployment

1. **Set environment variables in Vercel**:
   - Go to your project dashboard in Vercel
   - Navigate to Settings > Environment Variables
   - Add `CONNECTION_URL` with your MongoDB connection string
   - Ensure all other required environment variables are set

2. **Optimize for serverless**:
   - In Vercel, set function duration to at least 30 seconds:
     ```json
     // vercel.json
     "functions": {
       "index.js": {
         "memory": 1024,
         "maxDuration": 30
       }
     }
     ```

3. **Keep functions warm**:
   - Set up a cron job to ping your API every 5 minutes
   - Use a service like [cron-job.org](https://cron-job.org) to call your `/api/keepalive` endpoint

For more detailed troubleshooting, see [MONGODB_TROUBLESHOOTING.md](./docs/MONGODB_TROUBLESHOOTING.md)

## Testing

The project includes a comprehensive test suite built with Jest. The tests are organized into two categories:

### Unit Tests

Unit tests focus on testing individual components in isolation, mocking external dependencies. They are located in the `__tests__/unit/` directory and include tests for:

- **Auth Controller**: Tests for user registration and login functionality
- **User Controller**: Tests for user profile management, including profile updates and password changes
- **Artwork Controller**: Tests for creating, retrieving, and updating artwork
- **Chat Controller**: Tests for chat creation and message functionality
- **Image Controller**: Tests for image upload functionality
- **Notification Controller**: Tests for notification management

To run the unit tests:

```bash
npm run test:unit
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly. They are located in the `__tests__/integration/` directory.

To run the integration tests:

```bash
npm run test:integration
```

To run all tests:

```bash
npm test
```
