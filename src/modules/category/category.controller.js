import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const category = await categoryModel.create({ name, description, image });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image } = req.body;
  const category = await categoryModel.findByIdAndUpdate(id, { name, description, image }, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoryModel.findByIdAndDelete(id);
  res.json({ success: true });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryModel.find();
  res.json({ success: true, data: categories });
});

export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryModel.findById(id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
}); 