import { Document, Types } from 'mongoose';

// Encryption token structure
export interface EncryptedToken {
    iv: string;
    encryptedData: string;
}

// User document interface
export interface IUser extends Document {
    _id: Types.ObjectId;
    googleId: string;
    email: string;
    name?: string;
    tokens?: EncryptedToken;
    lastHistoryId?: string;
    createdAt: Date;
}

// Job document interface
export interface IJob extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    companyName: string;
    jobTitle: string;
    status: 'Applied' | 'Interviewing' | 'Rejection' | 'Offer' | 'Unknown';
    location?: string;
    email?: string;
    notes?: string;
    nextSteps?: string;
    dateApplied: Date;
    lastUpdated: Date;
    rawEmailThreadId?: string;
    rawEmailSubject?: string;
}

// AI extracted job data
export interface ExtractedJobData {
    companyName: string;
    jobTitle: string;
    status: 'Applied' | 'Interviewing' | 'Rejection' | 'Offer' | 'Unknown';
    nextSteps?: string;
}

// Email details from Gmail API
export interface EmailDetails {
    id: string | null | undefined;
    threadId: string | null | undefined;
    subject: string;
    from: string;
    body: string;
    snippet: string | null | undefined;
}
