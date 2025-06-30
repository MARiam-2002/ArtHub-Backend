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
├── docs
│   ├── CLIENT_INTEGRATION.md
│   ├── FLUTTER_INTEGRATION.md
│   ├── IMPROVEMENTS.md
│   ├── MONGODB_TROUBLESHOOTING.md
│   ├── SCREEN_API_MAPPING.md
│   ├── SOCKET_CHAT.md
│   └── guides/
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

### Documentation

The project includes comprehensive documentation in the `docs` directory:

- `CLIENT_INTEGRATION.md`: Guide for integrating client applications with the API
- `FLUTTER_INTEGRATION.md`: Specific instructions for Flutter client integration
- `IMPROVEMENTS.md`: List of implemented improvements and future recommendations
- `MONGODB_TROUBLESHOOTING.md`: Guide for troubleshooting MongoDB connection issues
- `SCREEN_API_MAPPING.md`: Mapping between frontend screens and API endpoints
- `SOCKET_CHAT.md`: Documentation for the Socket.io chat implementation

### Running Tests

```bash
npm test
```

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