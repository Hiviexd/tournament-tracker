import mongoose from "mongoose";
import config from "@tc/config";
import { initMongoose } from "@tc/models/init";
import utils from "@tc/utils/server";
import MigrationRunner from "./migrations/MigrationRunner";

initMongoose();

// Get migration name from CLI arguments (ignore pnpm's pass-through "--")
const rawArg = process.argv[2];
const migrationName = rawArg && rawArg !== "--" ? rawArg : undefined;

if (!migrationName) {
    console.error(utils.consoleStyles("✗ Error: Migration name is required", ["red", "bold"]));
    console.log("\nUsage: pnpm migrate <MigrationName>");
    console.log("\nExample: pnpm migrate Pif2Votings");
    console.log("\nAvailable migrations:");
    MigrationRunner.listAvailable()
        .then((migrations) => {
            migrations.forEach((name) => console.log(`  - ${name}`));
            process.exit(1);
        })
        .catch(() => process.exit(1));
} else {
    mongoose.connect(config.connection);
    const database = mongoose.connection;

    database.on(
        "error",
        console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"])),
    );

    database.once("open", async function () {
        console.log(utils.consoleStyles("✓ Database connected", ["green", "bold", "underline"]));

        try {
            // Load and run the migration
            const migration = await MigrationRunner.loadMigration(migrationName);
            await migration.run();
            console.log(utils.consoleStyles("✓ Migration process completed", ["green", "bold"]));
            process.exit(0);
        } catch (error) {
            console.error(utils.consoleStyles("✗ Migration process failed", ["red", "bold"]));
            console.error(error);
            process.exit(1);
        } finally {
            // Close database connection
            await mongoose.connection.close();
        }
    });
}
