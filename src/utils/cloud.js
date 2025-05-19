/**
 * @deprecated This file is deprecated. Use cloudinary.js instead.
 * This file appears to be a duplicate of src/utils/cloudinary.js and will be removed in a future update.
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// تكوين Cloudinary باستخدام متغيرات البيئة
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

export default cloudinary;
