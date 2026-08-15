import cors from "cors";
import { RequestHandler } from "express";
import config from "@tc/config";

// CORS configuration that allows requests from client domain or API key requests
export const conditionalCors: RequestHandler = (req, res, next) => {
    // Skip CORS in dev env
    if (process.env.NODE_ENV === "development") {
        return next();
    }

    // Allow API key requests (they have Authorization header)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        return next();
    }

    // Allow requests from the client domain
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowedOrigins = [
        config.baseUrl,
        "http://localhost:3000", // Backend
        "http://localhost:8088", // Frontend
        `http://localhost:${process.env.PORT}`, // Custom port
        "https://osu.ppy.sh", // osu!
    ];
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    const allowedHeaders = ["Content-Type", "Authorization", "X-CSRF-Token"];

    // Check origin first
    if (origin && allowedOrigins.includes(origin)) {
        return cors({
            origin,
            credentials: true,
            methods,
            allowedHeaders,
        })(req, res, next);
    }

    // If no origin but we have a referer from allowed domain, allow it
    if (!origin && referer && allowedOrigins.some((allowed) => referer.startsWith(allowed))) {
        return cors({
            origin: false, // Disable origin checking
            credentials: true,
            methods,
            allowedHeaders,
        })(req, res, next);
    }

    // Block all other requests
    return res.status(403).json({
        error: "Access denied. This endpoint is only accessible from the client application or with a valid API key.",
    });
};
