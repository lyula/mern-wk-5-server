const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOrCreatePrivateChat, getAllPrivateChats } = require('../controllers/chatController');
// Get all private chats for the logged-in user
router.get('/private', auth, getAllPrivateChats);

// Get or create a private chat between current user and :userId
router.get('/private/:userId', auth, getOrCreatePrivateChat);

module.exports = router;
