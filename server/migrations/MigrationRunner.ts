import { readdir } from "fs/promises";
import { join } from "path";
import BaseMigration from "./BaseMigration";

class MigrationRunner {
    /**
     * Extracts migration name from filename
     * Pattern: YYYY-MM-DD_<Name>Migration.ts
     * Returns: <Name>
     */
    private extractMigrationName(filename: string): string | null {
        // Match pattern: YYYY-MM-DD_<Name>Migration.ts or <Name>Migration.ts
        const match = filename.match(/^(?:\d{4}-\d{2}-\d{2}_)?(.+?)Migration\.(ts|js)$/);
        if (!match) return null;
        return match[1];
    }

    /**
     * Loads a migration by name (without date prefix)
     */
    public async loadMigration(name: string): Promise<BaseMigration> {
        const migrationsDir = join(__dirname);
        const files = await readdir(migrationsDir);

        // Find file matching the migration name
        const migrationFile = files.find((file) => {
            const extractedName = this.extractMigrationName(file);
            return extractedName === name;
        });

        if (!migrationFile) {
            const available = await this.listAvailable();
            throw new Error(
                `Migration "${name}" not found. Available migrations: ${available.join(", ")}`
            );
        }

        // Try both .ts and .js extensions
        const fileWithoutExt = migrationFile.replace(/\.(ts|js)$/, "");
        const basePath = join(migrationsDir, fileWithoutExt);

        let module;
        try {
            // Try .ts first (for development)
            try {
                module = await import(`${basePath}.ts`);
            } catch (tsError) {
                // Fall back to .js (for production)
                try {
                    module = await import(`${basePath}.js`);
                } catch (jsError) {
                    // Last resort: try without extension
                    try {
                        module = await import(basePath);
                    } catch (noExtError) {
                        throw tsError;
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to load migration "${name}" from ${migrationFile}: ${error}`);
        }

        // Get the default export
        const MigrationClass = module.default;
        if (!MigrationClass) {
            throw new Error(`Migration "${name}" has no default export`);
        }

        // Instantiate the migration
        const migration = new MigrationClass();
        if (!(migration instanceof BaseMigration)) {
            throw new Error(`Migration "${name}" is not a BaseMigration instance`);
        }

        // Verify the name matches
        if (migration.name !== name) {
            throw new Error(
                `Migration name mismatch: expected "${name}", got "${migration.name}"`
            );
        }

        return migration;
    }

    /**
     * Lists all available migration names
     */
    public async listAvailable(): Promise<string[]> {
        const migrationsDir = join(__dirname);
        const files = await readdir(migrationsDir);

        const migrations: string[] = [];

        for (const file of files) {
            const name = this.extractMigrationName(file);
            if (name && file !== "BaseMigration.ts" && file !== "BaseMigration.js" && file !== "MigrationRunner.ts" && file !== "MigrationRunner.js") {
                migrations.push(name);
            }
        }

        return migrations.sort();
    }
}

export default new MigrationRunner();
