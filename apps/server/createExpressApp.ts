import express, { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStoreSession from "connect-mongo";
import config from "@tc/config";
import { initMongoose } from "@tc/models/init";
import { logger } from "./middlewares/logger";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import utils from "@tc/utils/server";
import { authenticateRequest } from "./middlewares/authenticateRequest";
import { conditionalCsrf, handleCsrfError } from "./middlewares/csrf";
import { conditionalCors } from "./middlewares/cors";
import { sessionRateLimiter, apiKeyRateLimiter } from "./middlewares/rateLimiter";
import { handleCrawlers } from "./middlewares/seo";
import votingsRouter from "./routers/votingsRouter";
import logsRouter from "./routers/logsRouter";
import tournamentsRouter from "./routers/tournamentsRouter";
import ticketsRouter from "./routers/ticketsRouter";
import articlesRouter from "./routers/articlesRouter";
import devRouter from "./routers/devRouter";
import resourcesRouter from "./routers/resourcesRouter";
import beatmapsRouter from "./routers/beatmapsRouter";
import statusRouter from "./routers/statusRouter";
import quotesRouter from "./routers/quotesRouter";
import templatesRouter from "./routers/templatesRouter";
import dashboardRouter from "./routers/dashboardRouter";
import apiKeysRouter from "./routers/apiKeysRouter";
import complianceRouter from "./routers/complianceRouter";
import globalSearchRouter from "./routers/globalSearchRouter";
import infringementsRouter from "./routers/infringementsRouter";
import enchantRouter from "./routers/enchantRouter";
import { apiReference } from "@scalar/express-api-reference";
import openApiSpec from "./openapi";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Build the Express application (middleware + remaining Express routers)
 * without final 404/error handlers. Nest controllers register during app.init();
 * call registerFinalHandlers after that so Nest routes are not swallowed.
 */
export function createExpressApp(): express.Application {
    initMongoose();

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

    // database
    mongoose.connect(config.connection);
    const database = mongoose.connection;

    database.on(
        "error",
        console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"])),
    );
    database.once("open", function () {
        console.log(utils.consoleStyles("✓ Database connected", ["green", "bold", "underline"]));
    });

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

    // Enchant sidebar skips CORS/CSRF, gated via HMAC
    app.use("/api/enchant", enchantRouter);

    // API auth stack at app level so Nest routes share it
    app.use(
        "/api",
        authenticateRequest as express.RequestHandler,
        conditionalCors as express.RequestHandler,
        sessionRateLimiter as express.RequestHandler,
        apiKeyRateLimiter as express.RequestHandler,
        conditionalCsrf as express.RequestHandler,
    );

    // Remaining Express routers (auth + users owned by Nest)
    app.use("/api/votings", votingsRouter);
    app.use("/api/logs", logsRouter);
    app.use("/api/tournaments", tournamentsRouter);
    app.use("/api/tickets", ticketsRouter);
    app.use("/api/articles", articlesRouter);
    app.use("/api/dev", devRouter);
    app.use("/api/resources", resourcesRouter);
    app.use("/api/beatmaps", beatmapsRouter);
    app.use("/api/status", statusRouter);
    app.use("/api/quotes", quotesRouter);
    app.use("/api/templates", templatesRouter);
    app.use("/api/dashboard", dashboardRouter);
    app.use("/api/keys", apiKeysRouter);
    app.use("/api/compliance", complianceRouter);
    app.use("/api/search", globalSearchRouter);
    app.use("/api/infringements", infringementsRouter);

    return app;
}

/**
 * Attach 404 + error handlers after Nest has registered its routes via app.init().
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
