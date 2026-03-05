require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'exp://'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/farmers', require('./src/routes/farmers'));
app.use('/api/buyers', require('./src/routes/buyers'));
app.use('/api/negotiation', require('./src/routes/negotiation'));
app.use('/api/contracts', require('./src/routes/contracts'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/notifications', require('./src/routes/notifications'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Socket.io – real-time events
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join personal notification room
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Join a negotiation session chat room
  socket.on('join_session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`Socket joined session_${sessionId}`);
  });

  socket.on('leave_session', (sessionId) => {
    socket.leave(`session_${sessionId}`);
  });

  // Typing indicator
  socket.on('typing', ({ sessionId, userName }) => {
    socket.to(`session_${sessionId}`).emit('user_typing', { userName });
  });

  socket.on('stop_typing', ({ sessionId }) => {
    socket.to(`session_${sessionId}`).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🌾 AgriLink Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
});
