const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createGroup, getGroups, deleteGroup, getGlobalChat, getGroupById } = require('../controllers/groupController');

router.post('/', auth, createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, getGroupById); // <-- Add this line
router.delete('/:id', auth, deleteGroup);
// Get global chat group
router.get('/global', auth, getGlobalChat);
// Add/remove member, kick (admin remove)
const groupController = require('../controllers/groupController');
router.post('/:id/add-member', auth, groupController.addMember);
router.post('/:id/remove-member', auth, groupController.removeMember);
router.post('/:id/kick-member', auth, groupController.kickMember);

module.exports = router;
