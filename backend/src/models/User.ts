import mongoose from 'mongoose';
import type { IUser } from '../types/index.js';

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    // Encryption fields for the refresh token
    tokens: {
        iv: { type: String, select: false }, // protected
        encryptedData: { type: String, select: false } // protected
    },
    lastHistoryId: { type: String }, // For syncing Gmail
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);