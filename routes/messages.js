const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  addReaction,
  markAsRead,
  searchMessages,
} = require('../controllers/messageController');

router.post('/', auth, sendMessage);

// Debug: Test message creation directly via HTTP
const Message = require('../models/Message');
const Group = require('../models/Group');
router.post('/test-direct', auth, async (req, res) => {
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
    const populatedMsg = await Message.findById(message._id).populate('sender', 'username profilePic _id');
    res.status(201).json(populatedMsg);
  } catch (err) {
    console.error('[test-direct] Error:', err);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});
router.get('/:chatId', auth, getMessages);
router.post('/reaction', auth, addReaction);
router.post('/read', auth, markAsRead);
router.get('/:chatId/search', auth, searchMessages);

module.exports = router;
