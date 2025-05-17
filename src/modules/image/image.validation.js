
import joi from "joi";
import { isValidObjectId } from "mongoose";

const defaultMessages = {
  "string.base": "{#label} يجب أن يكون نصًا.",
  "string.empty": "{#label} مطلوب ولا يمكن أن يكون فارغًا.",
  "any.required": "{#label} مطلوب."
};

export const createImageSchema = joi.object({
  title: joi.string().label("عنوان الصورة"),
  description: joi.string().allow('').label("وصف الصورة"),
  tags: joi.array().items(joi.string()).single().label("العلامات"),
  category: joi.string().label("التصنيف"),
  images: joi.array().label("الصور") // This is for the multer files, not validated by Joi
}).messages(defaultMessages);

export const updateImageSchema = joi.object({
  imageId: joi.string().required().label("معرف الصورة"),
  title: joi.string().label("عنوان الصورة"),
  description: joi.string().allow('').label("وصف الصورة"),
  tags: joi.array().items(joi.string()).single().label("العلامات"),
  category: joi.string().label("التصنيف")
}).messages(defaultMessages);

export const imageIdSchema = joi.object({
  imageId: joi.string().required().label("معرف الصورة")
}).messages(defaultMessages);

export const publicIdSchema = joi.object({
  publicId: joi.string().required().label("معرف الصورة العام")
}).messages(defaultMessages);
