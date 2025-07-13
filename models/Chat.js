const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false }, // false for private chat
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // always 2 for private
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', chatSchema);
