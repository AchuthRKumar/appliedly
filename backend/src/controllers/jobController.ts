import { Request, Response } from 'express';
import { Job } from '../models/Job.js';
import { io } from '../index.js';

export const getJobs = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const jobs = await Job.find({ userId }).sort({ lastUpdated: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const createJob = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const { companyName, jobTitle, status, location, email, notes } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        const newJob = await Job.create({
            userId,
            companyName,
            jobTitle: jobTitle || 'Unknown Role',
            status: status || 'Applied',
            location,
            email,
            notes,
            lastUpdated: new Date(),
        });

        // Emit real-time update
        io.to(userId.toString()).emit('job-updated', newJob);

        res.status(201).json(newJob);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const { id } = req.params;
        const updates = req.body;

        const job = await Job.findOne({ _id: id, userId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Update allowed fields
        if (updates.companyName) job.companyName = updates.companyName;
        if (updates.jobTitle) job.jobTitle = updates.jobTitle;
        if (updates.status) job.status = updates.status;
        if (updates.location !== undefined) job.location = updates.location;
        if (updates.email !== undefined) job.email = updates.email;
        if (updates.notes !== undefined) job.notes = updates.notes;
        if (updates.nextSteps !== undefined) job.nextSteps = updates.nextSteps;
        
        job.lastUpdated = new Date();
        await job.save();

        // Emit real-time update
        io.to(userId.toString()).emit('job-updated', job);

        res.json(job);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const { id } = req.params;

        const job = await Job.findOneAndDelete({ _id: id, userId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Emit real-time update for deletion
        io.to(userId.toString()).emit('job-deleted', { id: job._id });

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const getJob = async (req: Request, res: Response) => {
    try {
        const userId = (req.session as any).userId;
        const { id } = req.params;

        const job = await Job.findOne({ _id: id, userId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
