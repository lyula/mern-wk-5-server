require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS config
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const connectDB = require('./config/db');
connectDB();


// Routes

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const chatRoutes = require('./routes/chats');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chats', chatRoutes);
app.get('/', (req, res) => {
  res.send('API is running');
});

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io', // Explicitly set path for compatibility
});


// Socket.io event handlers
const socketHandlers = require('./socket');
socketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
