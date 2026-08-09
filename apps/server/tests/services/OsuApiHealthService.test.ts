import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OsuApiHealthService from "../../services/OsuApiHealthService";
import { ErrorResponse } from "@tc/types/Responses";

describe("OsuApiHealthService", () => {
    beforeEach(() => {
        OsuApiHealthService.resetForTests();
        vi.useFakeTimers();
    });

    afterEach(() => {
        OsuApiHealthService.resetForTests();
        vi.useRealTimers();
    });

    describe("isInfrastructureFailure", () => {
        it("treats missing status codes as infrastructure failures", () => {
            expect(OsuApiHealthService.isInfrastructureFailure({ error: "timeout", source: "osu-api" })).toBe(true);
        });

        it("treats 5xx responses as infrastructure failures", () => {
            expect(
                OsuApiHealthService.isInfrastructureFailure({
                    error: "server error",
                    statusCode: 503,
                    source: "osu-api",
                }),
            ).toBe(true);
        });

        it("ignores client errors such as 404", () => {
            expect(
                OsuApiHealthService.isInfrastructureFailure({ error: "not found", statusCode: 404, source: "osu-api" }),
            ).toBe(false);
        });
    });

    describe("circuit breaker", () => {
        const infraError = (statusCode?: number): ErrorResponse => ({
            error: "failure",
            statusCode,
            source: "osu-api",
        });

        it("marks down after three infrastructure failures within the window", () => {
            OsuApiHealthService.recordFailure(infraError(503));
            OsuApiHealthService.recordFailure(infraError(503));
            OsuApiHealthService.recordFailure(infraError(503));

            expect(OsuApiHealthService.getStatus()).toEqual({
                status: "down",
                since: expect.any(String),
            });
        });

        it("does not mark down for non-infrastructure failures", () => {
            for (let i = 0; i < 5; i++) {
                OsuApiHealthService.recordFailure({ error: "not found", statusCode: 404, source: "osu-api" });
            }

            expect(OsuApiHealthService.getStatus()).toEqual({
                status: "healthy",
                since: null,
            });
        });

        it("recovers to healthy after a successful response", () => {
            OsuApiHealthService.recordFailure(infraError(503));
            OsuApiHealthService.recordFailure(infraError(503));
            OsuApiHealthService.recordFailure(infraError(503));

            OsuApiHealthService.recordSuccess();

            expect(OsuApiHealthService.getStatus()).toEqual({
                status: "healthy",
                since: null,
            });
        });

        it("expires failures outside the two-minute window", () => {
            OsuApiHealthService.recordFailure(infraError(503));
            OsuApiHealthService.recordFailure(infraError(503));

            vi.advanceTimersByTime(2 * 60 * 1000 + 1);

            OsuApiHealthService.recordFailure(infraError(503));

            expect(OsuApiHealthService.getStatus().status).toBe("healthy");
        });
    });
});
