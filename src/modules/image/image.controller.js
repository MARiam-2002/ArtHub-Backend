import { asyncHandler } from '../../utils/asyncHandler.js';
import cloudinary from '../../utils/cloudinary.js';
import fs from 'fs';

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  const uploaded = await Promise.all(
    files.map(async file => {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'artworks' });
      fs.unlinkSync(file.path); // حذف الملف المؤقت بعد الرفع
      return result.secure_url;
    })
  );
  res.status(201).json({ success: true, urls: uploaded });
});
