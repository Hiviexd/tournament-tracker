import mongoose from "mongoose";
import config from "@tc/config";
import { initMongoose } from "@tc/models/init";
import JobLoader from "./jobs/JobLoader";
import utils from "@tc/utils/server";

initMongoose();

mongoose.connect(config.connection);
const database = mongoose.connection;

database.on(
    "error",
    console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"])),
);

database.once("open", async () => {
    console.log(utils.consoleStyles("✓ Database connected", ["green", "bold", "underline"]));

    const environmentString = process.env.NODE_ENV || "⚠ Unknown";
    const environmentStyled = process.env.NODE_ENV
        ? utils.consoleStyles(process.env.NODE_ENV, ["yellow", "underline"])
        : utils.consoleStyles("⚠ Unknown", ["orange", "underline"]);

    const automationDebug = process.env.AUTOMATION_DEBUG === "true";

    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log(`│ ${utils.consoleStyles("✓ Jobs worker started", ["green", "bold"])}${" ".repeat(37)}│`);
    console.log(
        `│   ${utils.consoleStyles("Environment:", ["dim"])} ${environmentStyled}${" ".repeat(
            42 - environmentString.length,
        )}│`,
    );
    if (automationDebug) {
        const mode = "Auto-start Automation Jobs";
        console.log(
            `│   ${utils.consoleStyles("Mode:", ["dim"])} ${utils.consoleStyles(mode, ["orange", "bold"])}${" ".repeat(
                49 - mode.length,
            )}│`,
        );
    }
    console.log("└──────────────────────────────────────────────────────────┘");

    await JobLoader.loadJobs();
    JobLoader.startAll();
});
