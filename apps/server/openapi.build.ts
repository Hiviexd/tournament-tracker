import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { openApiOverlay } from "./openapi.overlay";

/** HTTP methods Nest/Swagger may emit on a path item. */
const HTTP_METHODS = [
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace",
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

/**
 * Public API-key surface + status (same allowlist as the former hand-written openapi.ts).
 * Param segment names are normalized to `{param}` so Nest's `{tournamentId}` etc. match.
 */
const PUBLIC_OPS = new Set([
    "post /api/compliance/validate",
    "get /api/tournaments",
    "get /api/tournaments/{param}",
    "get /api/votes",
    "get /api/votes/{param}",
    "get /api/resources",
    "get /api/users/me",
    "get /api/tickets",
    "get /api/tickets/{param}",
    "get /api/status",
]);

function ensureApiPrefix(path: string): string {
    const withSlash = path.startsWith("/") ? path : `/${path}`;
    if (withSlash === "/api" || withSlash.startsWith("/api/")) return withSlash;
    return `/api${withSlash}`;
}

/** Normalize path for allowlist matching (prefix + collapse `{name}` → `{param}`). */
export function normalizePublicPath(path: string): string {
    return ensureApiPrefix(path).replace(/\{[^}]+\}/g, "{param}");
}

function isPublicOperation(method: string, path: string): boolean {
    return PUBLIC_OPS.has(`${method.toLowerCase()} ${normalizePublicPath(path)}`);
}

/** Keep only public API-key (+ status) operations; ensure `/api` prefix on path keys. */
export function filterPublicPaths(document: OpenAPIObject): OpenAPIObject {
    const filteredPaths: NonNullable<OpenAPIObject["paths"]> = {};

    for (const [rawPath, pathItem] of Object.entries(document.paths ?? {})) {
        if (!pathItem || typeof pathItem !== "object") continue;

        const outPath = ensureApiPrefix(rawPath);
        const kept: Record<string, unknown> = {};

        for (const method of HTTP_METHODS) {
            const operation = pathItem[method as HttpMethod];
            if (operation && isPublicOperation(method, rawPath)) {
                kept[method] = operation;
            }
        }

        if (Object.keys(kept).length === 0) continue;

        // Preserve path-level params if present
        if ("parameters" in pathItem && pathItem.parameters) {
            kept.parameters = pathItem.parameters;
        }

        filteredPaths[outPath] = kept as (typeof filteredPaths)[string];
    }

    return { ...document, paths: filteredPaths };
}

/** Merge Nest document with hand-written guide overlay (info, servers, tags, bearerAuth). */
export function mergeOpenApiOverlay(document: OpenAPIObject): OpenAPIObject {
    return {
        ...document,
        info: {
            ...document.info,
            ...openApiOverlay.info,
        },
        servers: openApiOverlay.servers,
        tags: openApiOverlay.tags,
        components: {
            ...document.components,
            securitySchemes: {
                ...document.components?.securitySchemes,
                ...openApiOverlay.components.securitySchemes,
            },
        },
    };
}

/** Build Nest OpenAPI, filter to public surface, apply overlay. */
export function createPublicOpenApiDocument(app: INestApplication): OpenAPIObject {
    const config = new DocumentBuilder()
        .setTitle(openApiOverlay.info.title)
        .setVersion(openApiOverlay.info.version)
        .addBearerAuth(
            {
                type: "http",
                scheme: "bearer",
                description: openApiOverlay.components.securitySchemes.bearerAuth.description,
            },
            "bearerAuth",
        )
        .build();

    const nestDocument = SwaggerModule.createDocument(app, config);
    return mergeOpenApiOverlay(filterPublicPaths(nestDocument));
}
