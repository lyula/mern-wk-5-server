const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, getProfile } = require('../controllers/userController');

router.get('/', auth, getUsers);
router.get('/me', auth, getProfile);

module.exports = router;
