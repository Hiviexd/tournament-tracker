import { OsuApiStatus } from "../../interfaces/Status";
import { ErrorResponse } from "../../interfaces/Responses";

const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 2 * 60 * 1000;
const RECOVERY_PROBE_INTERVAL_MS = 5 * 60 * 1000;

class OsuApiHealthService {
    private static failureTimestamps: number[] = [];
    private static isDown = false;
    private static downSince: string | null = null;

    static isInfrastructureFailure(error: ErrorResponse): boolean {
        if (error.statusCode === undefined) {
            return true;
        }

        return error.statusCode >= 500;
    }

    static recordSuccess(): void {
        this.failureTimestamps = [];

        if (!this.isDown) {
            return;
        }

        this.isDown = false;
        this.downSince = null;
        this.stopRecoveryProbe();
    }

    static recordFailure(error: ErrorResponse): void {
        if (!this.isInfrastructureFailure(error)) {
            return;
        }

        const now = Date.now();
        this.failureTimestamps = this.failureTimestamps.filter((timestamp) => now - timestamp <= FAILURE_WINDOW_MS);
        this.failureTimestamps.push(now);

        if (this.failureTimestamps.length < FAILURE_THRESHOLD) {
            return;
        }

        const wasHealthy = !this.isDown;
        this.isDown = true;

        if (wasHealthy) {
            this.downSince = new Date().toISOString();
            this.startRecoveryProbe();
        }
    }

    static getStatus(): OsuApiStatus {
        return {
            status: this.isDown ? "down" : "healthy",
            since: this.downSince,
        };
    }

    /** @internal Resets all state — for tests only */
    static resetForTests(): void {
        this.failureTimestamps = [];
        this.isDown = false;
        this.downSince = null;
        this.stopRecoveryProbe();
    }

    private static startRecoveryProbe(): void {
        if (global.__osuApiRecoveryInterval) {
            return;
        }

        global.__osuApiRecoveryInterval = setInterval(() => {
            void this.runRecoveryProbe();
        }, RECOVERY_PROBE_INTERVAL_MS);
    }

    private static stopRecoveryProbe(): void {
        if (!global.__osuApiRecoveryInterval) {
            return;
        }

        clearInterval(global.__osuApiRecoveryInterval);
        global.__osuApiRecoveryInterval = undefined;
    }

    private static async runRecoveryProbe(): Promise<void> {
        try {
            const { default: OsuBotService } = await import("./OsuBotService");
            const result = await OsuBotService.getPublicBotToken();

            if (typeof result === "string") {
                this.recordSuccess();
            }
        } catch {
            // Probe failure is recorded via executeRequest instrumentation
        }
    }
}

declare global {
    // eslint-disable-next-line no-var
    var __osuApiRecoveryInterval: NodeJS.Timeout | undefined;
}

export default OsuApiHealthService;
