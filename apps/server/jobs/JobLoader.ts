import { readdir, access } from "fs/promises";
import { join, dirname, basename } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import config from "@tc/config";
import BaseJob from "./BaseJob";
import utils from "@tc/utils/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class JobLoader {
    private jobs: BaseJob[] = [];

    /**
     * Determines the correct jobs directory based on the environment:
     * - Development (tsx): __dirname is server/jobs/ (already in jobs dir)
     * - Production (bundled): __dirname is dist/server/ (need to append jobs/)
     */
    private async getJobsDir(): Promise<string> {
        // Check if we're already in a jobs directory (development with tsx)
        if (basename(__dirname) === "jobs") {
            return __dirname;
        }

        // Otherwise, look in jobs/ subdirectory (production bundled build)
        const jobsSubdir = join(__dirname, "jobs");
        try {
            await access(jobsSubdir);
            return jobsSubdir;
        } catch {
            // Fallback to current directory
            return __dirname;
        }
    }

    public async loadJobs(): Promise<void> {
        if (!config.automation) {
            console.log(utils.consoleStyles("⚠ Automation disabled in config", ["yellow", "bold"]));
            return;
        }

        const jobsDir = await this.getJobsDir();
        const files = await readdir(jobsDir);

        // Filter for job files (ends with Job.ts or Job.js, excluding BaseJob and JobLoader)
        const jobFiles = files.filter(
            (file) =>
                (file.endsWith("Job.ts") || file.endsWith("Job.js")) &&
                file !== "BaseJob.ts" &&
                file !== "BaseJob.js" &&
                file !== "JobLoader.ts" &&
                file !== "JobLoader.js",
        );

        for (const file of jobFiles) {
            try {
                // Try both .ts (development) and .js (production) extensions
                const fileWithoutExt = file.replace(/\.(ts|js)$/, "");
                const basePath = join(jobsDir, fileWithoutExt);

                let module;
                let modulePath;

                // Try .js first for production, then .ts for development
                // (use pathToFileURL for Windows compatibility)
                // react-doctor: dynamic import path is intentional — job modules are discovered from disk at runtime.
                try {
                    modulePath = `${basePath}.js`;
                    module = await import(pathToFileURL(modulePath).href);
                } catch (jsError) {
                    // Fall back to .ts for development
                    try {
                        modulePath = `${basePath}.ts`;
                        module = await import(pathToFileURL(modulePath).href);
                    } catch {
                        throw jsError;
                    }
                }

                // Get the default export or first export that extends BaseJob
                const JobClass =
                    module.default || Object.values(module).find((exp: any) => exp.prototype instanceof BaseJob);

                if (!JobClass) {
                    console.warn(
                        utils.consoleStyles(`⚠ Skipping ${file}: No default export or BaseJob extension found`, [
                            "yellow",
                        ]),
                    );
                    continue;
                }

                // Instantiate the job
                const job = new JobClass();
                if (!(job instanceof BaseJob)) {
                    console.warn(
                        utils.consoleStyles(`⚠ Skipping ${file}: Export is not a BaseJob instance`, ["yellow"]),
                    );
                    continue;
                }

                this.jobs.push(job);
                console.log(
                    utils.consoleStyles(`✓ Loaded job "${job.name}" with schedule "${job.schedule}"`, ["green"]),
                );
            } catch (error) {
                console.error(utils.consoleStyles(`✗ Failed to load job from ${file}:`, ["red", "bold"]));
                console.error(error);
            }
        }

        console.log(utils.consoleStyles(`✓ Loaded ${this.jobs.length} job(s)`, ["green", "bold", "underline"]));
    }

    public startAll(): void {
        if (!config.automation) {
            return;
        }

        for (const job of this.jobs) {
            job.start();
        }

        if (this.jobs.length > 0) {
            console.log(utils.consoleStyles("✓ All jobs started!", ["green", "bold", "underline"]));
        }

        // Run immediately for testing
        if (process.env.AUTOMATION_DEBUG === "true") {
            console.log(utils.consoleStyles("Running all jobs immediately...", ["yellow", "bold"]));
            this.runAllNow();
        }
    }

    public stopAll(): void {
        for (const job of this.jobs) {
            job.stop();
        }
        console.log(utils.consoleStyles("All jobs stopped!", ["yellow", "bold", "underline"]));
    }

    public async runAllNow(): Promise<void> {
        for (const job of this.jobs) {
            await job.runNow();
        }
        console.log(utils.consoleStyles("All jobs run successfully!", ["green", "bold", "underline"]));
    }

    public getJobs(): BaseJob[] {
        return [...this.jobs];
    }
}

export default new JobLoader();
