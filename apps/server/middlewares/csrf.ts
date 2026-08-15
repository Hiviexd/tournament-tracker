import csurf from "csurf";
import { ErrorRequestHandler, RequestHandler } from "express";

// Initialize csurf with session-based tokens
export const csrfProtection = csurf({ cookie: false });

export const conditionalCsrf: RequestHandler = (req, res, next) => {
    // Only apply csurf for session-authenticated flows where a session user exists
    if (res.locals?.authMethod === "session" && req.session?.mongoId) {
        // SAFETY: csurf's handler is typed against Express 5 Request/Response; this app uses Express 4.
        return (csrfProtection as any)(req, res, next);
    }
    return next();
};

// Error handler mapping EBADCSRFTOKEN -> 403
export const handleCsrfError: ErrorRequestHandler = (err, _req, res, next) => {
    if (err && err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next(err);
};
