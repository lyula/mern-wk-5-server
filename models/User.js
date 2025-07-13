const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
