const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper to create a system message in a group
exports.createSystemMessage = async (groupId, content) => {
  const msg = await Message.create({
    chat: groupId,
    sender: null, // null or a special system user
    content,
    type: 'system',
  });
  await Group.findByIdAndUpdate(groupId, { $push: { messages: msg._id } });
  return msg;
};
