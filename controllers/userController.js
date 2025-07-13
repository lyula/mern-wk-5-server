const User = require('../models/User');
const { formatDate } = require('../utils/date');

// Get paginated user list
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const users = await User.find({}, '-password')
      .sort({ isOnline: -1, lastSeen: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update online status and last seen
exports.updatePresence = async (userId, isOnline) => {
  await User.findByIdAndUpdate(userId, {
    isOnline,
    lastSeen: isOnline ? Date.now() : undefined,
  });
};
