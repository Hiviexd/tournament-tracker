import utils from "../../utils/server";

export default abstract class BaseMigration {
    abstract name: string;
    abstract description: string;

    public async run(): Promise<void> {
        const startTime = Date.now();
        this.log(
            utils.consoleStyles(`⚠  ${this.description}`, ["orange", "bold", "underline"])
        );

        try {
            await this.execute();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.log(
                utils.consoleStyles(
                    `✓ Migration completed successfully in ${duration}s`,
                    ["green", "bold"]
                )
            );
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error(
                utils.consoleStyles(`✗ Migration failed after ${duration}s:`, ["red", "bold"])
            );
            console.error(error);
            throw error;
        }
    }

    protected abstract execute(): Promise<void>;

    protected log(message: string): void {
        console.log(utils.consoleStyles(`[${this.name}]`, ["cyan", "dim"]) + ` ${message}`);
    }
}
