import express, { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStoreSession from "connect-mongo";
import config from "@tc/config";
import { logger } from "./middlewares/logger";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import utils from "@tc/utils/server";
import JobLoader from "./jobs/JobLoader";
import { authenticateRequest } from "./middlewares/authenticateRequest";
import { conditionalCsrf, handleCsrfError } from "./middlewares/csrf";
import { conditionalCors } from "./middlewares/cors";
import { sessionRateLimiter, apiKeyRateLimiter } from "./middlewares/rateLimiter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Return the "new" updated object by default when doing findByIdAndUpdate
mongoose.plugin((schema) => {
    schema.pre("findOneAndUpdate", function (this: any) {
        if (!("new" in this.options)) {
            this.setOptions({ new: true });
        }
    });
});

// Make queries strict like in v5
mongoose.set("strictQuery", true);

const app = express();
const MongoStore = MongoStoreSession(session);

// Behind Cloudflare (or any reverse proxy), trust the proxy so req.ip and
// express-rate-limit use the correct client IP from X-Forwarded-For
// TODO: possibly limit to Cloudflare's IPs only
app.set("trust proxy", true);

// SEO
import { handleCrawlers } from "./middlewares/seo";

app.use(handleCrawlers);

// settings/middlewares
app.use(logger);
app.use(
    express.json({
        limit: "50mb",
        verify: (req, _res, buf) => {
            // Capture raw body for Enchant HMAC verification
            if (req.headers["enchant-signature"]) {
                // SAFETY: json verify receives IncomingMessage; rawBody is declared on Express Request.
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

// routes
import authRouter from "./routers/authRouter";
import usersRouter from "./routers/usersRouter";
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
import checklistRouter from "./routers/checklistRouter";
import enchantRouter from "./routers/enchantRouter";
import { apiReference } from "@scalar/express-api-reference";
import openApiSpec from "./openapi";

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

// Public health/version endpoint (for uptime monitoring)
app.use("/api/status", statusRouter);

// setup api routes
const apiRouter = express.Router();

// Determine auth method (apiKey vs session)
apiRouter.use(authenticateRequest);

// Conditionally enforce CORS
apiRouter.use(conditionalCors);

// Rate limit based on auth method
apiRouter.use(sessionRateLimiter);
apiRouter.use(apiKeyRateLimiter);

// Conditionally enforce CSRF
apiRouter.use(conditionalCsrf);

// API routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/votes", votingsRouter);
apiRouter.use("/logs", logsRouter);
apiRouter.use("/tournaments", tournamentsRouter);
apiRouter.use("/tickets", ticketsRouter);
apiRouter.use("/articles", articlesRouter);
apiRouter.use("/dev", devRouter);
apiRouter.use("/resources", resourcesRouter);
apiRouter.use("/beatmaps", beatmapsRouter);
apiRouter.use("/quotes", quotesRouter);
apiRouter.use("/templates", templatesRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/keys", apiKeysRouter);
apiRouter.use("/compliance", complianceRouter);
apiRouter.use("/search", globalSearchRouter);
apiRouter.use("/infringements", infringementsRouter);
apiRouter.use("/checklist", checklistRouter);

app.use("/api", apiRouter);

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
app.use(handleCsrfError);
// eslint-disable-next-line no-unused-vars
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

    if (res.headersSent) {
        console.error(err);
        return;
    }

    res.status(statusCode).json({ error: responseMessage });

    if (!isDev) console.error(err);
    else console.log(err);
});

// server setup
const port = process.env.PORT || "3000";
const environmentString = process.env.NODE_ENV || "⚠ Unknown";
const environmentStyled = process.env.NODE_ENV
    ? utils.consoleStyles(process.env.NODE_ENV, ["yellow", "underline"])
    : utils.consoleStyles("⚠ Unknown", ["orange", "underline"]);

const automationJob = process.env.AUTOMATION_JOB?.trim();
const mode =
    process.env.AUTOMATION_DEBUG === "true"
        ? automationJob
            ? `Auto-start Job: ${automationJob}`
            : "Auto-start Automation Jobs"
        : process.env.MIGRATION === "true"
          ? "Run Migrations"
          : null;

app.set("port", port);

app.listen(port, async (err?: Error) => {
    if (err) throw err;
    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log(`│ ${utils.consoleStyles("✓ Server started", ["green", "bold"])}${" ".repeat(41)}│`);
    console.log(
        `│   ${utils.consoleStyles("Port:", ["dim"])} ${utils.consoleStyles(port, ["cyan"])}${" ".repeat(
            49 - port.length,
        )}│`,
    );
    console.log(
        `│   ${utils.consoleStyles("Environment:", ["dim"])} ${environmentStyled}${" ".repeat(
            42 - environmentString.length,
        )}│`,
    );
    if (mode)
        console.log(
            `│   ${utils.consoleStyles("Mode:", ["dim"])} ${utils.consoleStyles(mode, ["orange", "bold"])}${" ".repeat(
                49 - mode.length,
            )}│`,
        );
    console.log("└──────────────────────────────────────────────────────────┘");

    // Load and start jobs
    await JobLoader.loadJobs();
    JobLoader.startAll();
});

export default app;
