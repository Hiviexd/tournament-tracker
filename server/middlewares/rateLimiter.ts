import rateLimit from "express-rate-limit";

export const beatmapCheckLimiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 1, // 1 request per window
    message: {
        error: "Too many requests, please try again after 5 seconds",
    },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
});
