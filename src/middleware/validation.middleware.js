import { Types } from 'mongoose';

// ✅ Custom validator for ObjectId
export const isValidObjectId = (value, helpers) =>
  Types.ObjectId.isValid(value) ? value : helpers.message('المعرّف غير صالح (Invalid ObjectId)');

// ✅ Middleware for schema validation
export const isValidation = Schema => (req, res, next) => {
  const copyReq = {
    ...req.body,
    ...req.params,
    ...req.query,
    ...req.files
  };

  const { error } = Schema.validate(copyReq, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(err => err.message);

    return res.status(400).json({
      success: false,
      message: 'فشل التحقق من البيانات',
      errors: errorMessages
    });
  }

  return next();
};
