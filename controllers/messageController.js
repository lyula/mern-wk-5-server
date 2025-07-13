const Message = require('../models/Message');
const Group = require('../models/Group');

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, type } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content required' });
    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
      type: type || 'text',
      readBy: [req.user.id],
    });
    await Group.findByIdAndUpdate(chatId, { $push: { messages: message._id } });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

// Get paginated messages for a chat
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username profilePic');
    const total = await Message.countDocuments({ chat: chatId });
    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// Add reaction
exports.addReaction = async (req, res, next) => {
  try {
    const { messageId, reaction } = req.body;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { user: req.user.id, reaction } } },
      { new: true }
    );
    res.json(message);
  } catch (err) {
    next(err);
  }
};

// Mark as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: req.user.id } },
      { new: true }
    );
    res.json(message);
  } catch (err) {
    next(err);
  }
};

// Message search
exports.searchMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: q, $options: 'i' },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username profilePic');
    res.json(messages);
  } catch (err) {
    next(err);
  }
};
