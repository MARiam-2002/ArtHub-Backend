import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';

export async function getHomeData(req, res, next) {
  try {
    // أحدث 8 أعمال فنية
    const latestArtworks = await artworkModel.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({ path: 'artist', select: 'email job profileImage' });

    // أفضل 5 فنانين (حسب عدد الأعمال)
    const topArtists = await userModel.aggregate([
      { $match: { role: 'artist' } },
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'artist',
          as: 'artworks',
        },
      },
      { $addFields: { artworksCount: { $size: '$artworks' } } },
      { $sort: { artworksCount: -1 } },
      { $limit: 5 },
      { $project: { email: 1, job: 1, profileImage: 1, artworksCount: 1 } },
    ]);

    res.success({ latestArtworks, topArtists }, 'تم جلب بيانات الصفحة الرئيسية بنجاح');
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.fail(null, 'يرجى إدخال كلمة بحث.', 400);
    }
    const regex = new RegExp(q, 'i');
    // بحث في الأعمال الفنية
    const artworks = await artworkModel.find({
      $or: [
        { title: regex },
        { description: regex },
      ],
    }).populate({ path: 'artist', select: 'email job profileImage' });
    // بحث في الفنانين
    const artists = await userModel.find({
      role: 'artist',
      $or: [
        { email: regex },
        { job: regex },
        { displayName: regex },
      ],
    }).select('email job profileImage displayName');
    res.success({ artworks, artists }, 'تم جلب نتائج البحث بنجاح');
  } catch (err) {
    next(err);
  }
} 