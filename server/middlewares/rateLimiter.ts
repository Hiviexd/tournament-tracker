import rateLimit from "express-rate-limit";

export const csrfTokenFetchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many CSRF token requests, slow down" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
});

export const apiKeyManagementLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Too many API key management requests" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.session?.mongoId as string) || req.ip || "unknown",
});

// Session-based rate limiter
export const sessionRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // 500 requests per minute
    message: { error: "Rate limit exceeded" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.session?.mongoId as string || req.ip || "unknown";
    },
    skip: (req, res) => res.locals?.authMethod === "apiKey", // skip if API key
});

// API key rate limiter
export const apiKeyRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // 100 requests per 10 minutes
    message: { error: "Rate limit exceeded" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req.headers["authorization"] as string) || req.ip || "unknown";
    },
    skip: (req, res) => res.locals?.authMethod !== "apiKey", // apply only to API keys
});
