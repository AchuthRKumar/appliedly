import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import { googleLogin, googleCallback } from './controllers/authController.js';
import { handleGmailWebhook } from './controllers/webhookController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    keys: [process.env.SESSION_SECRET as string], // Use your SESSION_SECRET from .env
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JS from accessing cookie
    sameSite: 'lax' // CSRF protection, 'none' if frontend is different domain
  })
);

const allowedOrigins = [
  'http://localhost:5173', // For local frontend development
  // frontend URL
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // Allow cookies to be sent
}));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a room based on userId for private updates
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// DB Connection
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

app.get('/auth/google', googleLogin);
app.get('/auth/google/callback', googleCallback);
app.post('/webhook/gmail', handleGmailWebhook);

// Test Route
app.get('/', (req, res) => {
  res.send('Job Dashboard API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io }; // Export io to use in webhook controller