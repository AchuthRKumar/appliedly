import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import { googleLogin, googleCallback, getUserProfile } from './controllers/authController.js';
import { handleGmailWebhook } from './controllers/webhookController.js';
import { getJobs, createJob, updateJob, deleteJob, getJob } from './controllers/jobController.js';
import { requireAuth } from './middleware/requireAuth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// Cookie session configuration - different for local vs production
// For local development, we're on HTTP localhost, so secure must be false
const isLocalhost = process.env.PORT === '5000' || !process.env.PORT || process.env.NODE_ENV !== 'production';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error('ERROR: SESSION_SECRET is not set in environment variables!');
  console.error('Cookies will not work without SESSION_SECRET.');
}

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    keys: sessionSecret ? [sessionSecret] : ['default-secret-change-in-production'], // Use your SESSION_SECRET from .env
    secure: !isLocalhost, // Secure cookies only in production (HTTPS required), false for localhost HTTP
    httpOnly: true, // Prevent client-side JS from accessing cookie
    sameSite: isLocalhost ? 'lax' : 'none', // 'lax' for localhost, 'none' for cross-origin in production
    name: 'session' // Explicit cookie name
  })
);

console.log('Cookie session configured:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  isLocalhost: isLocalhost,
  secure: !isLocalhost,
  sameSite: isLocalhost ? 'lax' : 'none',
  hasSecret: !!sessionSecret
});

// Debug middleware to log all requests (after cookie-session so we can see session data)
app.use((req, res, next) => {
  if (req.path === '/auth/me' || req.path === '/auth/google/callback') {
    console.log(`${req.method} ${req.path} - Request:`, {
      origin: req.headers.origin,
      cookie: req.headers.cookie,
      session: req.session,
      sessionUserId: (req.session as any)?.userId,
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    
    // Log response headers after response is sent
    res.on('finish', () => {
      const setCookieHeader = res.getHeader('set-cookie');
      console.log(`${req.method} ${req.path} - Response:`, {
        statusCode: res.statusCode,
        'set-cookie': setCookieHeader,
        hasSetCookie: !!setCookieHeader
      });
    });
  }
  next();
});

const allowedOrigins = [
  'http://localhost:5173', // For local frontend development
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean) as string[]; // Remove undefined values
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
app.get('/auth/me', requireAuth, getUserProfile);
app.post('/webhook/gmail', handleGmailWebhook);

// Job routes
app.get('/jobs', requireAuth, getJobs);
app.post('/jobs', requireAuth, createJob);
app.get('/jobs/:id', requireAuth, getJob);
app.put('/jobs/:id', requireAuth, updateJob);
app.delete('/jobs/:id', requireAuth, deleteJob);

// Test Route
app.get('/', (req, res) => {
  res.send('Job Dashboard API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io }; // Export io to use in webhook controller