import { Request, Response } from "express";

interface DeprecateOptions {
    newRoute?: string;
}

export function deprecate(req: Request, res: Response, options: DeprecateOptions = {}) {
    let message = `Route "${req.originalUrl}" is deprecated and has been removed.`;
    if (options.newRoute) message += ` Use "/api${options.newRoute}" instead.`;

    console.warn(
        `User ${req.session?.username || res.locals?.user?.username || "Unknown"} tried to access deprecated route "${req.originalUrl}"`,
    );
    res.status(410).json({ error: message });
}
