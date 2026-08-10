import { NextFunction, Request, Response } from "express";
import ApiKeyService from "../services/ApiKeyService";

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
    const authz = req.headers["authorization"];
    if (authz && typeof authz === "string" && authz.startsWith("Bearer ")) {
        const rawKey = authz.slice("Bearer ".length).trim();
        if (rawKey) {
            const result = await ApiKeyService.validate(rawKey, req);
            if (result) {
                res.locals = res.locals || {};
                res.locals.user = result.user;
                res.locals.apiKey = result.apiKey; // expose apiKey for scope checks
                res.locals.authMethod = "apiKey";
                // We're setting this to false so no APIs are accessible by key by default, and only
                // allow routes that have RequireScopesGuard to be usable via key.
                res.locals.isAccessibleViaKey = false;
                return next();
            }
            return res.status(401).json({ error: "Invalid or revoked API key" });
        }
    }

    // Fallback to existing optionalAuth or session-based flow elsewhere
    res.locals = res.locals || {};
    res.locals.authMethod = "session";
    res.locals.isAccessibleViaKey = false; // Session routes are not accessible via API key by default
    return next();
}
