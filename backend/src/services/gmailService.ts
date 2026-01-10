import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { EmailDetails } from '../types/index.js';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

//Helper: Get an authenticated Gmail Client for a specific user
export const getGmailClient = (refreshToken: string) => {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.gmail({ version: 'v1', auth: oauth2Client });
};

//1. WATCH: Tell Google to push notifications to Pub/Sub
export const watchGmail = async (refreshToken: string) => {
    const gmail = getGmailClient(refreshToken);

    const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            labelIds: ['INBOX', 'SPAM'], 
            topicName: `${process.env.GOOGLE_TOPIC}` 
        }
    });

    return res.data; 
};

//2. FETCH MESSAGE: Get the full email content
export const getEmailDetails = async (refreshToken: string, messageId: string): Promise<EmailDetails> => {
    const gmail = getGmailClient(refreshToken);

    const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
    });

    const payload = res.data.payload;
    const headers = payload?.headers;

    const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers?.find(h => h.name === 'From')?.value || 'Unknown';

    // simple body extraction (handles text/plain and text/html)
    let body = '';
    if (payload?.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
    } else if (payload?.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return {
        id: res.data.id,
        threadId: res.data.threadId,
        subject,
        from,
        body,
        snippet: res.data.snippet
    };
};

//3. GET HISTORY: Find what changed since the last notification
export const getGmailHistory = async (refreshToken: string, startHistoryId: string) => {
    const gmail = getGmailClient(refreshToken);

    try {
        const res = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: startHistoryId,
            historyTypes: ['messageAdded'] 
        });
        return res.data.history || [];
    } catch (error) {
        console.error("History fetch error (likely historyId too old):", error);
        return []; 
    }
};