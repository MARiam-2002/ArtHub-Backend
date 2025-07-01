import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 محاولات فقط لكل IP
  message: { success: false, message: 'محاولات كثيرة جدًا، حاول لاحقًا.' }
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'محاولات رفع كثيرة جدًا، حاول لاحقًا.' }
});
