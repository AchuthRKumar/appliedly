import mongoose from 'mongoose';
import type { IJob } from '../types/index.js';

const JobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true, index: true },
    jobTitle: { type: String, default: 'Unknown Role' },
    status: {
        type: String,
        enum: ['Applied', 'Interviewing', 'Rejection', 'Offer', 'Unknown'],
        default: 'Applied'
    },
    nextSteps: { type: String },
    dateApplied: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    rawEmailThreadId: { type: String, unique: true }, // Prevent duplicate processing
    rawEmailSubject: { type: String }
});

export const Job = mongoose.model<IJob>('Job', JobSchema);