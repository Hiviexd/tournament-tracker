import { CronJob } from "cron";
import utils from "../../utils";

export default abstract class BaseJob {
    abstract name: string;
    abstract schedule: string;
    protected successMessage: string = "";
    protected job: CronJob | null = null;

    private initializeJob(): void {
        if (this.job) {
            return; // Already initialized
        }

        try {
            this.job = new CronJob(this.schedule, this.execute.bind(this), null, false);
        } catch (error) {
            console.error(
                utils.consoleStyles(
                    `✗ Failed to initialize job "${this.name}": Invalid schedule "${this.schedule}"`,
                    ["red", "bold"]
                )
            );
            console.error(error);
        }
    }

    public start(): void {
        // Initialize lazily when start() is called (after child class properties are set)
        if (!this.job) {
            this.initializeJob();
        }

        if (!this.job) {
            console.error(
                utils.consoleStyles(`✗ Cannot start job "${this.name}": Job not initialized`, ["red", "bold"])
            );
            return;
        }

        this.job.start();
        this.log(`✓ Job "${this.name}" started with schedule "${this.schedule}"`);
    }

    public stop(): void {
        if (!this.job) {
            return;
        }

        this.job.stop();
        this.log(`Job "${this.name}" stopped`);
    }

    public async runNow(): Promise<void> {
        this.log(`Running job "${this.name}" immediately...`);
        try {
            await this.execute();
            this.log(utils.consoleStyles(`✓ ${this.successMessage || `Job "${this.name}" completed successfully`}`, ["green"]));
        } catch (error) {
            console.error(utils.consoleStyles(`✗ Job "${this.name}" failed:`, ["red", "bold"]));
            console.error(error);
        }
    }

    protected abstract execute(): Promise<void>;

    protected log(message: string): void {
        console.log(utils.consoleStyles(`[${this.name}]`, ["cyan", "dim"]) + ` ${message}`);
    }

    protected setSuccessMessage(message: string): void {
        this.successMessage = message;
    }
}
