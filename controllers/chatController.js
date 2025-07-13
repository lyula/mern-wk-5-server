// Get all private chats for the logged-in user
exports.getAllPrivateChats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const chats = await require('../models/Chat').find({
      isGroup: false,
      members: userId
    }).populate('members', 'username profilePic isOnline lastSeen');
    res.json({ chats });
  } catch (err) {
    next(err);
  }
};
const Chat = require('../models/Chat');
const User = require('../models/User');

// Get or create a private chat between two users
exports.getOrCreatePrivateChat = async (req, res, next) => {
  try {
    const userId1 = req.user.id;
    const userId2 = req.params.userId;
    if (!userId2 || userId1 === userId2) {
      return res.status(400).json({ message: 'Invalid userId' });
    }
    // Find existing private chat
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [userId1, userId2], $size: 2 },
    }).populate('members', 'username profilePic isOnline lastSeen');
    if (!chat) {
      // Create new private chat
      chat = await Chat.create({
        isGroup: false,
        members: [userId1, userId2],
      });
      // Optionally add to users' chat lists if you track that
    }
    res.json(chat);
  } catch (err) {
    next(err);
  }
};
