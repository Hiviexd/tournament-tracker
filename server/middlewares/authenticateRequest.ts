import { NextFunction, Request, Response } from "express";
import ApiKeyService from "../services/ApiKeyService";
import { type ApiScope } from "../../interfaces/ApiKey";

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
                // allow routes that have requireScopes middleware to be usable via key.
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

export function requireScopes(scopes: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Session users bypass scope checks (role-based auth applies in existing middlewares)
        if (res.locals?.authMethod !== "apiKey") return next();

        const apiKey = res.locals?.apiKey;
        if (!apiKey || apiKey.revokedAt) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const hasAll = scopes.every((s) => apiKey.scopes.includes(s as ApiScope));
        if (!hasAll) {
            res.locals!.isAccessibleViaKey = false;
            return res.status(403).json({ error: "Missing required scope" });
        }
        res.locals!.isAccessibleViaKey = true;
        return next();
    };
}
