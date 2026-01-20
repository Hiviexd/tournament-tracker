import express, { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStoreSession from "connect-mongo";
import config from "../config.json";
import "express-async-errors";
import { logger } from "./middlewares/logger";
import path from "path";
import utils from "../utils";
import JobLoader from "./jobs/JobLoader";
import { authenticateRequest } from "./middlewares/authenticateRequest";
import { conditionalCsrf, handleCsrfError } from "./middlewares/csrf";
import { conditionalCors } from "./middlewares/cors";
import { sessionRateLimiter, apiKeyRateLimiter } from "./middlewares/rateLimiter";

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

app.use(handleCrawlers as express.RequestHandler);

// settings/middlewares
app.use(logger);
app.use(express.json({ limit: "50mb" }));
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
    console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"]))
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
        },
    })
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
import versionRouter from "./routers/versionRouter";
import quotesRouter from "./routers/quotesRouter";
import templatesRouter from "./routers/templatesRouter";
import dashboardRouter from "./routers/dashboardRouter";
import apiKeysRouter from "./routers/apiKeysRouter";
import complianceRouter from "./routers/complianceRouter";
import globalSearchRouter from "./routers/globalSearchRouter";

// setup api routes
const apiRouter = express.Router();

// Determine auth method (apiKey vs session)
apiRouter.use(authenticateRequest as express.RequestHandler);

// Conditionally enforce CORS
apiRouter.use(conditionalCors as express.RequestHandler);

// Rate limit based on auth method
apiRouter.use(sessionRateLimiter as express.RequestHandler);
apiRouter.use(apiKeyRateLimiter as express.RequestHandler);

// Conditionally enforce CSRF
apiRouter.use(conditionalCsrf as express.RequestHandler);

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
apiRouter.use("/version", versionRouter);
apiRouter.use("/quotes", quotesRouter);
apiRouter.use("/templates", templatesRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/keys", apiKeysRouter);
apiRouter.use("/compliance", complianceRouter);
apiRouter.use("/search", globalSearchRouter);

app.use("/api", apiRouter);

// 404 handler for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

// serve production frontend
const DIST_ENVS = ["production", "preview"];

if (DIST_ENVS.includes(process.env.NODE_ENV || "")) {
    const clientDist = path.join(__dirname, "../../client");

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

    res.status(statusCode).json({ error: customErrorMessage || err.message || "Something went wrong!" });

    console.log(err);
});

// server setup
const port = process.env.PORT || "3000";
const environmentString = process.env.NODE_ENV || "⚠ Unknown";
const environmentStyled = process.env.NODE_ENV
    ? utils.consoleStyles(process.env.NODE_ENV, ["yellow", "underline"])
    : utils.consoleStyles("⚠ Unknown", ["orange", "underline"]);

const mode =
    process.env.AUTOMATION_DEBUG === "true"
        ? "Auto-start Automation Jobs"
        : process.env.MIGRATION === "true"
        ? "Run Migrations"
        : null;

app.set("port", port);

app.listen(port, async () => {
    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log(`│ ${utils.consoleStyles("✓ Server started", ["green", "bold"])}${" ".repeat(41)}│`);
    console.log(
        `│   ${utils.consoleStyles("Port:", ["dim"])} ${utils.consoleStyles(port, ["cyan"])}${" ".repeat(
            49 - port.length
        )}│`
    );
    console.log(
        `│   ${utils.consoleStyles("Environment:", ["dim"])} ${environmentStyled}${" ".repeat(
            42 - environmentString.length
        )}│`
    );
    if (mode)
        console.log(
            `│   ${utils.consoleStyles("Mode:", ["dim"])} ${utils.consoleStyles(mode, ["orange", "bold"])}${" ".repeat(
                49 - mode.length
            )}│`
        );
    console.log("└──────────────────────────────────────────────────────────┘");

    // Load and start jobs
    await JobLoader.loadJobs();
    JobLoader.startAll();
});

export default app;
