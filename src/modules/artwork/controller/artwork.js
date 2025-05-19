import artworkModel from '../../../../DB/models/artwork.model.js';
import userModel from '../../../../DB/models/user.model.js';
import reviewModel from '../../../../DB/models/review.model.js';
import { getPaginationParams } from '../../../utils/pagination.js';

// جلب كل الأعمال الفنية مع بيانات الفنان
export async function getAllArtworks(req, res, next) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query, 12);
    const [artworks, totalCount] = await Promise.all([
      artworkModel.find({})
        .populate({ path: 'artist', select: 'email job profileImage' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      artworkModel.countDocuments({})
    ]);
    res.success(artworks, 'تم جلب الأعمال الفنية بنجاح');
  } catch (err) {
    next(err);
  }
}

// جلب تفاصيل عمل فني
export async function getArtworkById(req, res, next) {
  try {
    const artwork = await artworkModel.findById(req.params.id)
      .populate({ path: 'artist', select: 'email job profileImage' });
    if (!artwork) return res.fail(null, 'العمل غير موجود', 404);
    // احسب متوسط وعدد التقييمات
    const stats = await reviewModel.aggregate([
      { $match: { artwork: artwork._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const avgRating = stats[0]?.avgRating || 0;
    const reviewsCount = stats[0]?.count || 0;
    res.success({ ...artwork.toObject(), avgRating, reviewsCount });
  } catch (err) {
    next(err);
  }
}

export async function createArtwork(req, res, next) {
  try {
    const { title, description, image, price, category } = req.body;
    const artist = req.user._id;
    const artwork = await artworkModel.create({ title, description, image, price, category, artist });
    res.status(201).json({ success: true, data: artwork });
  } catch (err) {
    next(err);
  }
}

export async function updateArtwork(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, image, price, category } = req.body;
    const artwork = await artworkModel.findOneAndUpdate(
      { _id: id, artist: req.user._id },
      { title, description, image, price, category },
      { new: true }
    );
    if (!artwork) return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
    res.json({ success: true, data: artwork });
  } catch (err) {
    next(err);
  }
}

export async function deleteArtwork(req, res, next) {
  try {
    const { id } = req.params;
    const artwork = await artworkModel.findOneAndDelete({ _id: id, artist: req.user._id });
    if (!artwork) return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
    res.success(null, 'تم حذف العمل بنجاح');
  } catch (err) {
    next(err);
  }
}

export async function getAllArtworksByArtist(artistId) {
  return artworkModel.find({ artist: artistId })
    .populate({ path: 'artist', select: 'email job profileImage' })
    .sort({ createdAt: -1 });
}

export async function getAllArtworksByCategory(categoryId) {
  return artworkModel.find({ category: categoryId })
    .populate({ path: 'artist', select: 'email job profileImage' })
    .sort({ createdAt: -1 });
} 