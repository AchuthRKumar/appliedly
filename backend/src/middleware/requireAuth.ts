import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Debug logging
    console.log('requireAuth - Session check:', {
        hasSession: !!req.session,
        userId: req.session?.userId,
        cookies: req.headers.cookie,
        origin: req.headers.origin
    });
    
    if (!req.session || !req.session.userId) {
        console.log('requireAuth - Unauthorized: No session or userId');
        return res.status(401).send('Unauthorized');
    }
    next();
};
