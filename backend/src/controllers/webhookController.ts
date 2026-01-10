import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { decrypt } from '../lib/security.js';
import { getGmailHistory, getEmailDetails } from '../services/gmailService.js';
import { isJobRelated, extractJobData } from '../services/aiService.js';
import Fuse from 'fuse.js';
import { io } from '../index.js'; // Import socket instance
import type { IJob, ExtractedJobData } from '../types/index.js';

export const handleGmailWebhook = async (req: Request, res: Response) => {
    try {
        // 1. Acknowledge immediately (Google requires 200 OK fast)
        res.status(200).send('Received');

        // 2. Decode Pub/Sub Message
        const message = req.body.message;
        if (!message || !message.data) return;

        const decodedData = JSON.parse(Buffer.from(message.data, 'base64').toString());
        const { emailAddress, historyId } = decodedData;

        console.log(`🔔 Notification for: ${emailAddress}, New HistoryId: ${historyId}`);

        // 3. Find User
        const user = await User.findOne({ email: emailAddress }).select('+tokens');
        if (!user || !user.tokens) {
            console.error("User not found or no tokens");
            return;
        }

        // 4. Decrypt Token
        const refreshToken = decrypt(user.tokens);

        // 5. Get Changes since last HistoryId
        // If lastHistoryId is missing (fresh account), we might skip or fetch recent. 
        // For now, let's assume we proceed if we have a previous ID.
        if (!user.lastHistoryId) {
            user.lastHistoryId = historyId; // just sync up
            await user.save();
            return;
        }

        const historyEvents = await getGmailHistory(refreshToken, user.lastHistoryId);

        // 6. Process New Messages
        for (const history of historyEvents) {
            if (history.messagesAdded) {
                for (const msgInfo of history.messagesAdded) {
                    if (!msgInfo.message?.id) continue;

                    // Fetch Full Email
                    const email = await getEmailDetails(refreshToken, msgInfo.message.id);

                    // --- AI STEP 1: FILTER ---
                    const isJob = await isJobRelated(email.subject, email.from);
                    if (!isJob) {
                        console.log(`Skipping: ${email.subject}`);
                        continue;
                    }

                    console.log(`✅ MATCH FOUND: ${email.subject}`);

                    // --- AI STEP 2: EXTRACT ---
                    const jobData = await extractJobData(email.body);
                    if (!jobData) continue;

                    // --- DB & MATCHING LOGIC ---
                    // Fuzzy match company name for this user
                    const existingJobs = await Job.find({ userId: user._id });

                    const fuse = new Fuse(existingJobs, { keys: ['companyName'], threshold: 0.4 });
                    const searchResult = fuse.search(jobData.companyName);

                    let savedJob;

                    if (searchResult.length > 0) {
                        // Update Existing
                        const match = searchResult[0]?.item;
                        if (!match) continue;
                        match.status = jobData.status;
                        match.lastUpdated = new Date();
                        match.nextSteps = jobData.nextSteps;
                        // Optionally store threadId to prevent processing same email twice
                        if (email.threadId) {
                            match.rawEmailThreadId = email.threadId;
                        }
                        savedJob = await match.save();
                        console.log(`Updated job: ${match.companyName}`);
                    } else {
                        // Create New - build the object with proper typing
                        const newJobData: {
                            userId: typeof user._id;
                            companyName: string;
                            jobTitle: string;
                            status: string;
                            nextSteps?: string;
                            rawEmailThreadId?: string;
                            rawEmailSubject?: string;
                        } = {
                            userId: user._id,
                            companyName: jobData.companyName,
                            jobTitle: jobData.jobTitle,
                            status: jobData.status,
                            nextSteps: jobData.nextSteps,
                            rawEmailSubject: email.subject
                        };

                        // Only add threadId if it's a valid string
                        if (email.threadId) {
                            newJobData.rawEmailThreadId = email.threadId;
                        }

                        savedJob = await Job.create(newJobData);
                        console.log(`Created job: ${jobData.companyName}`);
                    }

                    // --- REAL-TIME NOTIFICATION ---
                    io.to(user._id.toString()).emit('job-updated', savedJob);
                }
            }
        }

        // 7. Update User's HistoryId
        user.lastHistoryId = historyId;
        await user.save();

    } catch (error) {
        console.error('Webhook Error:', error);
        // Don't send 500, or Google will retry. Log it and accept.
    }
};