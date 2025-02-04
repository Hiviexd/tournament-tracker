import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStoreSession from "connect-mongo";
import config from "../config.json";
import "express-async-errors";
import { logger } from "./middlewares/logger";

// Return the 'new' updated object by default when doing findByIdAndUpdate
mongoose.plugin((schema) => {
    schema.pre("findOneAndUpdate", function (this: any) {
        if (!("new" in this.options)) {
            this.setOptions({ new: true });
        }
    });
});

const app = express();
const MongoStore = MongoStoreSession(session);

// SEO
import { handleCrawlers } from "./middlewares/seo";

app.use(handleCrawlers as express.RequestHandler);

// settings/middlewares
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// database
mongoose.connect(config.connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});
const database = mongoose.connection;

database.on("error", console.error.bind(console, "Database connection error:"));
database.once("open", function () {
    console.log("Database connected!");
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

// setup api routes
const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/votings", votingsRouter);
apiRouter.use("/logs", logsRouter);
apiRouter.use("/tournaments", tournamentsRouter);

app.use("/api", apiRouter);

// catch 404
app.use((req, res) => {
    res.status(404);
    res.json({ error: "Not Found" });
});

// error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    let customErrorMessage = "";
    if (err.name == "DocumentNotFoundError") customErrorMessage = "Error: Object not found";

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.json({ error: customErrorMessage || err.message || "Something went wrong!" });

    console.log(err);
});

// server setup
const port = process.env.PORT || "3000";
app.set("port", port);
app.listen(port, () => {
    console.log("Listening on " + port);
    // insert automation stuff below
});

export default app;
