import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const category = await categoryModel.create({ name, description, image });
  res.success(category, 'تم إنشاء التصنيف بنجاح', 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image } = req.body;
  const category = await categoryModel.findByIdAndUpdate(id, { name, description, image }, { new: true });
  if (!category) return res.fail(null, 'التصنيف غير موجود', 404);
  res.success(category, 'تم تحديث التصنيف بنجاح');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoryModel.findByIdAndDelete(id);
  res.success(null, 'تم حذف التصنيف بنجاح');
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryModel.find();
  res.success(categories, 'تم جلب التصنيفات بنجاح');
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryModel.findById(id);
  if (!category) return res.fail(null, 'التصنيف غير موجود', 404);
  res.success(category, 'تم جلب التصنيف بنجاح');
}); 