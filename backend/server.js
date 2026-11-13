const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config/env');
require('./config/db'); // initialize DB tables and seeds

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  maxHttpBufferSize: 1e8 // 100MB limit for audio notes & photo attachments
});

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded ID files securely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach Socket.IO to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/verification', require('./routes/verification.routes'));
app.use('/api/safety', require('./routes/safety.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NEAP Backend', timestamp: new Date().toISOString() });
});

// Socket.IO handlers
require('./sockets/chatHandler')(io);

// Start server
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`NEAP Server running on http://localhost:${PORT}`);
  console.log(`Hyperlocal Elder Assistance Platform Backend Ready`);
  console.log(`===================================================`);
});
