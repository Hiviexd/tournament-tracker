import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RequestHandler } from "express";
import { isString } from "@tc/utils/common";
import { enqueueRateLimitAlert } from "../utils/rateLimitAlerts";

function keyFromIp(req: { ip?: string }): string {
    return req.ip ? ipKeyGenerator(req.ip) : "unknown";
}

function authorizationValue(req: { headers: { authorization?: string | string[] } }): string | undefined {
    const value = req.headers.authorization;
    return isString(value) ? value : undefined;
}

export const csrfTokenFetchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many CSRF token requests, slow down" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => keyFromIp(req),
});

export const apiKeyManagementLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Too many API key management requests" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.session?.mongoId || keyFromIp(req),
});

// Session-based rate limiter
export const sessionRateLimiter: RequestHandler = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute
    message: { error: "Rate limit exceeded! Please wait a minute and try again." },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.session?.mongoId || keyFromIp(req),
    skip: (req, res) => res.locals?.authMethod === "apiKey", // skip if API key
    handler: (req, res, _next, options) => {
        try {
            enqueueRateLimitAlert({
                type: "session",
                ip: req.ip || "unknown",
                path: req.originalUrl || req.path || "unknown",
                method: req.method,
                identifier: req.session?.mongoId || undefined,
                username: req.session?.username || undefined,
                osuId: req.session?.osuId ? String(req.session.osuId) : undefined,
            });
        } catch {
            console.error("Error enqueuing rate limit alert");
        }
        const status = options.statusCode ?? 429;
        const body = options.message ?? { error: "Rate limit exceeded! Please wait a minute and try again." };
        res.status(status).json(body);
    },
});

// API key rate limiter
export const apiKeyRateLimiter: RequestHandler = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // 100 requests per 10 minutes
    message: { error: "Rate limit exceeded! (>100 requests in 10 minutes)" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => authorizationValue(req) || keyFromIp(req),
    skip: (req, res) => res.locals?.authMethod !== "apiKey", // apply only to API keys
    handler: (req, res, _next, options) => {
        try {
            const rawAuth = authorizationValue(req) || "";
            const masked = rawAuth ? `${rawAuth.slice(0, 6)}…(${rawAuth.length})` : undefined;
            enqueueRateLimitAlert({
                type: "apiKey",
                ip: req.ip || "unknown",
                path: req.originalUrl || req.path || "unknown",
                method: req.method,
                identifier: masked,
                username: res.locals?.user?.username || undefined,
                osuId: res.locals?.user?.osuId ? String(res.locals.user.osuId) : undefined,
            });
        } catch {
            console.error("Error enqueuing rate limit alert");
        }
        const status = options.statusCode ?? 429;
        const body = options.message ?? { error: "Rate limit exceeded! (>100 requests in 10 minutes)" };
        res.status(status).json(body);
    },
});
