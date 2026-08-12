import { describe, expect, it } from "vitest";
import type { OpenAPIObject } from "@nestjs/swagger";
import { openApiOverlay } from "../openapi.overlay";
import { filterPublicPaths, mergeOpenApiOverlay, normalizePublicPath } from "../openapi.build";

describe("openapi overlay + public filter", () => {
    it("exports guide overlay fields used by Scalar", () => {
        expect(openApiOverlay.info.title).toBe("Tournament Tracker API");
        expect(openApiOverlay.info.description).toContain("Authorization: Bearer YOUR_API_KEY");
        expect(openApiOverlay.servers.length).toBeGreaterThan(0);
        expect(openApiOverlay.tags.map((t) => t.name)).toContain("Status");
        expect(openApiOverlay.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    });

    it("normalizes Nest paths with or without /api prefix", () => {
        expect(normalizePublicPath("/status")).toBe("/api/status");
        expect(normalizePublicPath("/api/status")).toBe("/api/status");
        expect(normalizePublicPath("/tournaments/{tournamentId}")).toBe("/api/tournaments/{param}");
        expect(normalizePublicPath("/api/tickets/{ticketId}")).toBe("/api/tickets/{param}");
    });

    it("keeps only public API-key + status operations", () => {
        const nestDoc = {
            openapi: "3.0.0",
            info: { title: "Nest", version: "0" },
            paths: {
                "/status": {
                    get: { summary: "Service status" },
                },
                "/api/tournaments": {
                    get: { summary: "Search tournaments" },
                    post: { summary: "should be filtered" },
                },
                "/tournaments/{tournamentId}": {
                    get: { summary: "Get tournament by ID" },
                },
                "/tournaments/create": {
                    post: { summary: "internal" },
                },
                "/compliance/validate": {
                    post: { summary: "Check beatmap compliance" },
                },
            },
        } as OpenAPIObject;

        const filtered = filterPublicPaths(nestDoc);
        expect(Object.keys(filtered.paths ?? {}).sort()).toEqual(
            ["/api/compliance/validate", "/api/status", "/api/tournaments", "/api/tournaments/{tournamentId}"].sort(),
        );
        expect(filtered.paths?.["/api/tournaments"]).toEqual({
            get: { summary: "Search tournaments" },
        });
        expect(filtered.paths?.["/api/status"]?.get).toBeTruthy();
        expect(filtered.paths?.["/api/compliance/validate"]?.post).toBeTruthy();
    });

    it("merges overlay info/tags/servers/bearerAuth onto Nest document", () => {
        const nestDoc = {
            openapi: "3.0.0",
            info: { title: "Nest", version: "0" },
            paths: { "/api/status": { get: {} } },
            components: { schemas: { Foo: { type: "object" } } },
        } as OpenAPIObject;

        const merged = mergeOpenApiOverlay(nestDoc);
        expect(merged.info.title).toBe(openApiOverlay.info.title);
        expect(merged.info.description).toBe(openApiOverlay.info.description);
        expect(merged.servers).toEqual(openApiOverlay.servers);
        expect(merged.tags).toEqual(openApiOverlay.tags);
        expect(merged.components?.securitySchemes?.bearerAuth).toEqual(
            openApiOverlay.components.securitySchemes.bearerAuth,
        );
        expect(merged.components?.schemas).toEqual({ Foo: { type: "object" } });
    });
});
