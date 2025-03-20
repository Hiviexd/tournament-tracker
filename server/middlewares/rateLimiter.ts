import rateLimit from "express-rate-limit";

export const beatmapCheckLimiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 1, // 1 request per window
    message: {
        error: "Too many requests, please try again after 5 seconds",
    },
    statusCode: 200, // TODO: change to 429 when frontend can handle non-200 status codes
    standardHeaders: true,
    legacyHeaders: false,
});
