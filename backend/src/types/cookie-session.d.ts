import 'cookie-session';

declare global {
    namespace Express {
        interface Request {
            session: {
                userId?: string;
                [key: string]: any;
            };
        }
    }
}
