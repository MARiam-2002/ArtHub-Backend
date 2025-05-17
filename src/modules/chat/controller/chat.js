import chatModel from '../../../../DB/models/chat.model.js';
import messageModel from '../../../../DB/models/message.model.js';

export const getChats = async (req, res, next) => {
  const userId = req.user.id;
  const chats = await chatModel.find({ members: userId })
    .populate('members', 'email profileImage')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'email profileImage' } })
    .sort({ updatedAt: -1 });
  return res.success(chats, "Chats fetched successfully.");
};

export const getMessages = async (req, res, next) => {
  const { chatId } = req.params;
  const messages = await messageModel.find({ chat: chatId })
    .populate('sender', 'email profileImage')
    .sort({ createdAt: 1 });
  return res.success(messages, "Messages fetched successfully.");
};

export const sendMessage = async (req, res, next) => {
  const { chatId } = req.params;
  const { text } = req.body;
  const message = await messageModel.create({
    chat: chatId,
    sender: req.user.id,
    text,
  });
  await chatModel.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: Date.now() });
  return res.success(message, "Message sent successfully.");
};

export const createChat = async (req, res, next) => {
  const { userId } = req.body;
  const chat = await chatModel.findOneAndUpdate(
    { members: { $all: [req.user.id, userId] } },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.success(chat, "Chat created/fetched successfully.");
};

// Chat controller functions can be added here if you want to separate logic from the router. 