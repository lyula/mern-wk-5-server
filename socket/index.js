// This file will contain all socket event handlers and logic

const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const { updatePresence } = require('../controllers/userController');

const onlineUsers = new Map(); // userId -> socket.id

function socketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected:', socket.id);
    let userId = null;

    // Catch-all event logger for debugging
    socket.onAny((event, ...args) => {
      console.log(`[Socket.io] Event received: ${event}`, args);
    });

    // Authenticate and track user
    socket.on('login', async (data, ack) => {
      userId = data.userId;
      onlineUsers.set(userId, socket.id);
      await updatePresence(userId, true);
      io.emit('userOnline', { userId });
      // Always join global chat room
      const Group = require('../models/Group');
      let globalChat = await Group.findOne({ name: 'Global Chat' });
      if (globalChat) {
        socket.join(globalChat._id.toString());
      }
      if (typeof ack === 'function') {
        ack({ success: true });
      }
    });

    // Join chat/group room
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('userJoined', { userId });
    });

    // Leave room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('userLeft', { userId });
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        if (!userId) {
          console.error('[sendMessage] ERROR: userId is not set for this socket. Data:', data);
          return;
        }
        console.log('[sendMessage] Incoming data:', data);
        // Save message to DB
        const message = await Message.create({
          chat: data.roomId,
          sender: userId,
          content: data.content,
          type: data.type || 'text',
          readBy: [userId],
        });
        console.log('[sendMessage] Message created:', message);
        await Group.findByIdAndUpdate(data.roomId, { $push: { messages: message._id } });
        // Populate sender for frontend display
        const populatedMsg = await Message.findById(message._id).populate('sender', 'username profilePic _id');
        console.log('[sendMessage] Populated message:', populatedMsg);
        io.to(data.roomId).emit('receiveMessage', { ...data, ...populatedMsg.toObject(), messageId: message._id });
        // Notify users
        socket.to(data.roomId).emit('notify', { type: 'new_message', roomId: data.roomId });
      } catch (err) {
        console.error('[sendMessage] Error:', err);
      }
    });

    // Typing indicator
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('typing', { userId });
    });
    socket.on('stopTyping', (roomId) => {
      socket.to(roomId).emit('stopTyping', { userId });
    });

    // Read receipt
    socket.on('readMessage', ({ roomId, messageId }) => {
      socket.to(roomId).emit('readMessage', { userId, messageId });
    });

    // Message reaction
    socket.on('reactMessage', ({ roomId, messageId, reaction }) => {
      socket.to(roomId).emit('reactMessage', { userId, messageId, reaction });
    });

    // Presence disconnect
    socket.on('disconnect', async () => {
      if (userId) {
        onlineUsers.delete(userId);
        await updatePresence(userId, false);
        io.emit('userOffline', { userId });
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
}

module.exports = socketHandlers;
