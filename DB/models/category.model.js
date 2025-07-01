import mongoose, { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String } // url
  },
  { timestamps: true }
);

const categoryModel = mongoose.models.Category || model('Category', categorySchema);
export default categoryModel;
