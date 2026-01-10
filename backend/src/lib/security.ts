import crypto from 'crypto';
import dotenv from 'dotenv';
import type { EncryptedToken } from '../types/index.js';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY || '';
const IV_LENGTH = 16;

if (KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

export const encrypt = (text: string) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
    };
};

export const decrypt = (token: EncryptedToken): string => {
    const iv = Buffer.from(token.iv, 'hex');
    const encryptedText = Buffer.from(token.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};