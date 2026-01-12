import { Request, Response } from 'express';
import { google } from 'googleapis';
import { User } from '../models/User.js';
import { decrypt, encrypt } from '../lib/security.js';
import { watchGmail } from '../services/gmailService.js';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.googleId ? `https://lh3.googleusercontent.com/a/${user.googleId}` : undefined // Approximation or fetch real one
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 1. Redirect user to Google Login
export const googleLogin = (req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force refresh_token generation
  });

  res.redirect(url);
};

// 2. Handle Callback
export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get User Info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.id || !userInfo.data.email) {
      throw new Error("Failed to get user info");
    }

    // Encrypt Refresh Token
    let encryptedTokens;
    if (tokens.refresh_token) {
      encryptedTokens = encrypt(tokens.refresh_token);
    }

    // Upsert User
    const updateData: any = {
      email: userInfo.data.email,
      name: userInfo.data.name,
      googleId: userInfo.data.id
    };

    if (encryptedTokens) {
      updateData.tokens = encryptedTokens;
    }

    let user = await User.findOneAndUpdate(
      { googleId: userInfo.data.id },
      updateData,
      { new: true, upsert: true, select: '+tokens' }
    );

    // START WATCHING GMAIL IMMEDIATELY
    if (user) {
      const rToken = tokens.refresh_token || (user.tokens ? decrypt(user.tokens) : undefined);

      if (rToken) {
        const watchRes = await watchGmail(rToken);

        if (watchRes.historyId) {
          user.lastHistoryId = watchRes.historyId;
        }
        await user.save();

        console.log(`Watching enabled for ${user.email}. History ID: ${watchRes.historyId}`);
      }
    }

    // Set session - ensure it's a string
    (req.session as any).userId = user._id.toString();
    
    // Debug logging BEFORE redirect
    console.log('OAuth callback - Session set:', {
        userId: user._id,
        userIdType: typeof user._id,
        sessionUserId: (req.session as any).userId,
        sessionUserIdType: typeof (req.session as any).userId,
        email: user.email,
        sessionKeys: Object.keys(req.session || {}),
        cookies: req.headers.cookie
    });
    
    // Redirect to Frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log('Redirecting to:', `${frontendUrl}/dashboard?uid=${user._id}`);
    
    // Log response headers to see if cookie is being set
    res.on('finish', () => {
        console.log('OAuth callback - Response sent. Headers:', {
            'set-cookie': res.getHeader('set-cookie'),
            statusCode: res.statusCode
        });
    });
    
    res.redirect(`${frontendUrl}/dashboard?uid=${user._id}`);

  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).send('Authentication Failed');
  }
};