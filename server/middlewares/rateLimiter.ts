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

// Conditional rate limiter that applies different limits based on auth method
export const conditionalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req, res) => {
        // More restrictive limits for API key requests
        if (res.locals?.authMethod === "apiKey") {
            return 100; // 100 requests per minute for API keys
        }
        // More lenient for session requests (web client)
        return 1000; // 1000 requests per minute for web client
    },
    message: { error: "Rate limit exceeded" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        // Use API key as identifier for API requests, IP for session requests
        if (res.locals?.authMethod === "apiKey") {
            return (req.headers["authorization"] as string) || req.ip || "unknown";
        }
        return req.ip || "unknown";
    },
});

// Burst protection for API keys
export const apiKeyBurstLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 20, // 20 requests per 10 seconds
    message: { error: "Burst rate limit exceeded" },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        // Only apply to API key requests
        if (res.locals?.authMethod === "apiKey") {
            return (req.headers["authorization"] as string) || req.ip || "unknown";
        }
        return "bypass"; // Bypass for session requests
    },
    skip: (req, res) => res.locals?.authMethod !== "apiKey", // Skip for non-API key requests
});
