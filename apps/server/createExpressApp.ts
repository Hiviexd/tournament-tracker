import express, { ErrorRequestHandler, RequestHandler } from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStoreSession from "connect-mongo";
import config from "@tc/config";
import { logger } from "./middlewares/logger";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { authenticateRequest } from "./middlewares/authenticateRequest";
import { conditionalCsrf, handleCsrfError } from "./middlewares/csrf";
import { conditionalCors } from "./middlewares/cors";
import { sessionRateLimiter, apiKeyRateLimiter } from "./middlewares/rateLimiter";
import { handleCrawlers } from "./middlewares/seo";
import { apiReference } from "@scalar/express-api-reference";
import openApiSpec from "./openapi";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Skip shared /api middleware for Enchant (HMAC-gated; no session/CORS/CSRF/rate-limit stack). */
function isEnchantApiPath(req: { originalUrl: string }): boolean {
    const pathOnly = req.originalUrl.split("?")[0];
    return pathOnly === "/api/enchant" || pathOnly.startsWith("/api/enchant/");
}

function unlessEnchant(middleware: RequestHandler): RequestHandler {
    return ((req, res, next) => {
        if (isEnchantApiPath(req)) {
            return next();
        }
        return (middleware as any)(req, res, next);
    }) as RequestHandler;
}

/**
 * Build the Express application (shared middleware + docs + Enchant) without final 404/error handlers.
 * Domain API routes live in Nest modules. Call registerFinalHandlers after Nest app.init().
 * Mongoose is connected by Nest DatabaseModule onModuleInit.
 */
export function createExpressApp(): express.Application {
    const app = express();
    const MongoStore = MongoStoreSession(session);

    // Behind Cloudflare (or any reverse proxy), trust the proxy so req.ip and
    // express-rate-limit use the correct client IP from X-Forwarded-For
    // TODO: possibly limit to Cloudflare's IPs only
    app.set("trust proxy", true);

    // SEO
    app.use(handleCrawlers as express.RequestHandler);

    // settings/middlewares
    app.use(logger);
    app.use(
        express.json({
            limit: "50mb",
            verify: (req, _res, buf) => {
                // Capture raw body for Enchant HMAC verification
                if (req.headers["enchant-signature"]) {
                    (req as express.Request).rawBody = buf;
                }
            },
        }),
    );
    app.use(express.urlencoded({ extended: false, limit: "50mb" }));
    app.use(cookieParser());

    // Handle payload too large error
    const payloadErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
        if (err?.type === "entity.too.large") {
            return res.status(413).json({ error: "Request entity too large" });
        }
        next(err);
    };

    app.use(payloadErrorHandler);

    // Session store uses mongoose.connection; DatabaseModule connects during Nest init
    app.use(
        session({
            secret: config.session,
            store: new MongoStore({ mongooseConnection: mongoose.connection }),
            resave: false,
            saveUninitialized: false,
            cookie: {
                sameSite: "lax",
                httpOnly: true,
            },
        }),
    );

    // API docs (outside auth/CORS/CSRF stack; under /api so the gateway proxies them)
    app.get("/api/openapi.json", (_req, res) => {
        res.json(openApiSpec);
    });
    app.use(
        "/api/docs",
        apiReference({
            url: "/api/openapi.json",
            theme: "default",
            persistAuth: true,
            metaData: {
                title: "Tournament Tracker API",
            },
        }),
    );

    // Shared /api middleware for Nest controllers (registered during app.init).
    // Enchant paths skip the whole chain (HMAC-gated Nest EnchantModule; historically unauthenticated).
    app.use(
        "/api",
        unlessEnchant(authenticateRequest as express.RequestHandler),
        unlessEnchant(conditionalCors as express.RequestHandler),
        unlessEnchant(sessionRateLimiter as express.RequestHandler),
        unlessEnchant(apiKeyRateLimiter as express.RequestHandler),
        unlessEnchant(conditionalCsrf as express.RequestHandler),
    );

    return app;
}

/**
 * Attach 404 + error handlers after Nest has registered its routes via app.init().
 * Nest AllExceptionsFilter handles Nest-pipeline errors; Express handlers remain for
 * CSRF and other Express-layer failures (e.g. Enchant).
 */
export function registerFinalHandlers(app: express.Application): void {
    // 404 handler for API routes
    app.use("/api/*splat", (req, res) => {
        res.status(404).json({ error: "API endpoint not found" });
    });

    // serve production frontend when not behind the Docker gateway
    const DIST_ENVS = ["production", "preview"];
    const serveClient = process.env.SERVE_CLIENT === "true";

    if (serveClient && DIST_ENVS.includes(process.env.NODE_ENV || "")) {
        // apps/server/dist → repo root dist/client
        const clientDist = path.join(__dirname, "../../../dist/client");

        // serve static frontend files
        app.use(express.static(clientDist));

        // fallback to index.html for SPA routes, exclude /api/*
        app.get(/^(?!\/api\/).*/, (req, res) => {
            const indexFile = path.join(clientDist, "index.html");

            res.sendFile(indexFile, (err) => {
                if (err) {
                    res.status(500).send("Internal Server Error");
                }
            });
        });
    }

    // catch 404
    app.use((req, res) => {
        // Check if it's an API request
        if (req.path.startsWith("/api/")) {
            res.status(404).json({ error: "API endpoint not found" });
        } else {
            res.status(404).json({ error: "Not Found" });
        }
    });

    // error handler
    app.use(handleCsrfError as express.ErrorRequestHandler);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, req, res, next) => {
        let customErrorMessage = "";
        let statusCode = 500;

        if (err.name === "DocumentNotFoundError") {
            customErrorMessage = "Object not found";
            statusCode = 404;
        } else if (err.name === "ValidationError") {
            customErrorMessage = "Validation error";
            statusCode = 400;
        } else if (err.name === "CastError") {
            customErrorMessage = "Invalid ID format";
            statusCode = 400;
        }

        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        const isDev = req.app.get("env") === "development";
        const responseMessage = customErrorMessage || (isDev ? err.message : "Something went wrong!");

        res.status(statusCode).json({ error: responseMessage });

        if (!isDev) console.error(err);
        else console.log(err);
    });
}
