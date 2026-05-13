import mongoose from "mongoose";
import config from "../config.json";
import utils from "../utils/server";
import MigrationRunner from "./migrations/MigrationRunner";

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

// Get migration name from CLI arguments
const migrationName = process.argv[2];

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
        console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"]))
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
