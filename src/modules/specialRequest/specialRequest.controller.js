import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createSpecialRequest = asyncHandler(async (req, res) => {
  const { artist, requestType, description, budget } = req.body;
  const sender = req.user._id;
  const request = await specialRequestModel.create({
    sender,
    artist,
    requestType,
    description,
    budget,
  });
  res.success(request, 'تم إنشاء الطلب الخاص بنجاح', 201);
});

export const getUserRequests = asyncHandler(async (req, res) => {
  const requests = await specialRequestModel.find({ sender: req.user._id }).populate('artist', 'email job');
  res.success(requests, 'تم جلب طلبات المستخدم بنجاح');
});

export const getArtistRequests = asyncHandler(async (req, res) => {
  const requests = await specialRequestModel.find({ artist: req.user._id }).populate('sender', 'email job');
  res.success(requests, 'تم جلب طلبات الفنان بنجاح');
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, response } = req.body;
  const request = await specialRequestModel.findOneAndUpdate(
    { _id: requestId, artist: req.user._id },
    { status, response },
    { new: true }
  );
  if (!request) return res.fail(null, 'الطلب غير موجود', 404);
  res.success(request, 'تم تحديث حالة الطلب بنجاح');
});

export const completeRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await specialRequestModel.findOneAndUpdate(
    { _id: requestId, artist: req.user._id },
    { status: 'completed' },
    { new: true }
  );
  if (!request) return res.fail(null, 'الطلب غير موجود أو غير مصرح', 404);
  res.success(request, 'تم اكتمال الطلب بنجاح');
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const request = await specialRequestModel.findOneAndDelete({ _id: requestId, sender: req.user._id });
  if (!request) return res.fail(null, 'الطلب غير موجود أو غير مصرح', 404);
  res.success(null, 'تم حذف الطلب بنجاح');
}); 