const { createSystemMessage } = require('./systemMessage');
// Add member to group
exports.addMember = async (req, res, next) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User already in group' });
    }
    group.members.push(memberId);
    await group.save();
    await User.findByIdAndUpdate(memberId, { $push: { groups: group._id } });
    // System message: <username> joined the group
    const user = await User.findById(memberId);
    await createSystemMessage(group._id, `${user.username} joined the group`);
    res.json({ message: 'Member added', group });
  } catch (err) {
    next(err);
  }
};

// Remove member from group
exports.removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User not in group' });
    }
    group.members = group.members.filter(id => id.toString() !== memberId);
    await group.save();
    await User.findByIdAndUpdate(memberId, { $pull: { groups: group._id } });
    // System message: <username> left the group
    const user = await User.findById(memberId);
    await createSystemMessage(group._id, `${user.username} left the group`);
    res.json({ message: 'Member removed', group });
  } catch (err) {
    next(err);
  }
};

// Remove by admin (kick)
exports.kickMember = async (req, res, next) => {
  try {
    const { memberId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }
    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User not in group' });
    }
    group.members = group.members.filter(id => id.toString() !== memberId);
    await group.save();
    await User.findByIdAndUpdate(memberId, { $pull: { groups: group._id } });
    // System message: <username> was removed from the group
    const user = await User.findById(memberId);
    await createSystemMessage(group._id, `${user.username} was removed from the group`);
    res.json({ message: 'Member removed by admin', group });
  } catch (err) {
    next(err);
  }
};
// Get group by ID (with members and messages)
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'username profilePic isOnline lastSeen')
      .populate('admins', 'username')
      .populate({
        path: 'messages',
        populate: { path: 'sender', select: 'username profilePic' },
        options: { sort: { createdAt: 1 } }
      });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    next(err);
  }
};
const Group = require('../models/Group');
const User = require('../models/User');

// Create group
exports.createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    // Allow 1 member only for global chat
    if (!name || !members || !Array.isArray(members) || (members.length < 2 && name !== 'Global Chat')) {
      return res.status(400).json({ message: 'Group name and at least 2 members required' });
    }
    const group = await Group.create({
      name,
      members,
      admins: [req.user.id],
      createdBy: req.user.id,
    });
    await User.updateMany({ _id: { $in: members } }, { $push: { groups: group._id } });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

// Get paginated group list (always include global chat)
exports.getGroups = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Find global chat
    let globalChat = await Group.findOne({ name: 'Global Chat' })
      .populate('members', 'username profilePic isOnline lastSeen')
      .populate('admins', 'username');
    // If not found, create it and add all users
    if (!globalChat) {
      const allUsers = await User.find({}, '_id');
      const userIds = allUsers.map(u => u._id);
      globalChat = await Group.create({
        name: 'Global Chat',
        members: userIds,
        admins: [],
        createdBy: userIds[0] || null,
      });
      await User.updateMany({}, { $push: { groups: globalChat._id } });
      globalChat = await Group.findById(globalChat._id)
        .populate('members', 'username profilePic isOnline lastSeen')
        .populate('admins', 'username');
    }
    // Find user groups
    const groups = await Group.find({ members: req.user.id, name: { $ne: 'Global Chat' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('members', 'username profilePic isOnline lastSeen')
      .populate('admins', 'username');
    const total = await Group.countDocuments({ members: req.user.id, name: { $ne: 'Global Chat' } });
    // Always include global chat at the top
    res.json({ groups: [globalChat, ...groups], total: total + 1, page, pages: Math.ceil((total + 1) / limit) });
  } catch (err) {
    next(err);
  }
};

// Get global chat group
exports.getGlobalChat = async (req, res, next) => {
  try {
    let globalChat = await Group.findOne({ name: 'Global Chat' })
      .populate('members', 'username profilePic isOnline lastSeen')
      .populate('admins', 'username');
    if (!globalChat) {
      const allUsers = await User.find({}, '_id');
      const userIds = allUsers.map(u => u._id);
      globalChat = await Group.create({
        name: 'Global Chat',
        members: userIds,
        admins: [],
        createdBy: userIds[0] || null,
      });
      await User.updateMany({}, { $push: { groups: globalChat._id } });
      globalChat = await Group.findById(globalChat._id)
        .populate('members', 'username profilePic isOnline lastSeen')
        .populate('admins', 'username');
    }
    res.json(globalChat);
  } catch (err) {
    next(err);
  }
};

// Delete group (admin only)
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can delete group' });
    }
    await group.deleteOne();
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
};

// Add/remove member, promote/demote admin, etc. can be added similarly
