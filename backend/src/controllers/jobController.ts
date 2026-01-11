import { Request, Response } from 'express';
import { Job } from '../models/Job.js';

export const getJobs = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const jobs = await Job.find({ userId }).sort({ lastUpdated: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).send('Server Error');
    }
};
