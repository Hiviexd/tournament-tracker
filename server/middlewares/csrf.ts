import csurf from "csurf";
import { NextFunction, Request, Response } from "express";

// Initialize csurf with session-based tokens
export const csrfProtection = csurf({ cookie: false });

export function conditionalCsrf(req: Request, res: Response, next: NextFunction) {
    // Only apply csurf for session-authenticated flows where a session user exists
    if (res.locals?.authMethod === "session" && req.session?.mongoId) {
        return (csrfProtection as any)(req, res, next);
    }
    return next();
}

// Error handler mapping EBADCSRFTOKEN -> 403
export function handleCsrfError(err: any, _req: Request, res: Response, next: NextFunction) {
    if (err && err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next(err);
}
