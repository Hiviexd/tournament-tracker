/**
 * OpenAPI 3.1 spec for Scalar docs at /api/docs.
 * Replaces: https://github.com/Hiviexd/tournament-tracker/wiki/API-Documentation
 */
const openApiSpec = {
    openapi: "3.1.0",
    info: {
        title: "Tournament Tracker API",
        version: "1.0.0",
        description: `
Programmatic access to Tournament Tracker data. Access is controlled through API keys with scope-based permissions.

If you only need the Mappool Compliance API in a pooling sheet, see the [Compliance API Usage Example](https://github.com/Hiviexd/tournament-tracker/wiki/Compliance-API-Example-Usage) wiki article.

Issues or bugs: open a [GitHub issue](https://github.com/Hiviexd/tournament-tracker/issues) or contact **hivie** on Discord.

## Authentication

All API requests (except service status) must include an API key:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Creating an API Key

1. Log in to Tournament Tracker with your osu! account
2. Open **Settings → API Keys**
3. Provide a descriptive name and select the required scopes
4. Click **Generate API Key**

The raw key is shown **only once** after creation. Store it securely — it cannot be retrieved later.

## Scopes

| Scope | Description |
| --- | --- |
| \`compliance:read\` | Mappool compliance checking |
| \`tournaments:read\` | Tournament data and listings |
| \`votings:read\` | Public voting data and results |
| \`resources:read\` | Resource library |
| \`users:read\` | Your own user profile |
| \`tickets:read\` | Ticket/report data |

## Rate Limits

**100 requests per 10 minutes** per API key. Responses include standard rate limit headers:

- \`RateLimit-Limit\`
- \`RateLimit-Remaining\`
- \`RateLimit-Reset\`

If these limits block a legitimate use case, reach out on Discord (hivie).

## Notes

- List/detail payloads for tournaments, votings, and tickets are **censored** for non-committee API key owners (sensitive fields omitted).
- Session/cookie auth used by the web app is out of scope here.
        `.trim(),
    },
    servers: [
        { url: "https://tcomm.hivie.tn", description: "Production" },
        { url: "/", description: "Current host" },
    ],
    tags: [
        { name: "Compliance", description: "Requires `compliance:read`" },
        { name: "Tournaments", description: "Requires `tournaments:read`" },
        {
            name: "Votings",
            description: "Requires `votings:read`. Non-committee keys only see concluded public votes.",
        },
        { name: "Resources", description: "Requires `resources:read`" },
        { name: "Users", description: "Requires `users:read`" },
        {
            name: "Tickets",
            description:
                "Requires `tickets:read`. Tickets and reports share one entity; differentiated by `type`. " +
                "With `type=report`, you only receive reports you own — other report query filters are ignored for non-committee keys.",
        },
        { name: "Status", description: "Public — no auth required" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                description: "API key from Settings → API Keys (`Authorization: Bearer <key>`)",
            },
        },
        schemas: {
            Error: {
                type: "object",
                required: ["error"],
                properties: {
                    error: { type: "string" },
                },
            },
            GameMode: {
                type: "string",
                enum: ["osu", "taiko", "catch", "mania"],
            },
            TournamentType: {
                type: "string",
                enum: ["tournament", "contest"],
            },
            TournamentStatus: {
                type: "string",
                enum: [
                    "supportRequestReceived",
                    "screeningConcluded",
                    "reviewOngoing",
                    "changesRequested",
                    "onHold",
                    "badgeApproved",
                    "badgeRejected",
                    "noBadgeRequested",
                ],
            },
            TournamentState: {
                type: "string",
                enum: ["active", "archived", "concluded", "all"],
                description:
                    "`active` (default when omitted via client), `archived`/`concluded` = inactive, `all` = no filter",
            },
            UserGroup: {
                type: "string",
                enum: ["user", "tc", "cc", "admin", "alm", "dev"],
            },
            UserSummary: {
                type: "object",
                description: "Sanitized user fields typically returned on nested relations",
                properties: {
                    _id: { type: "string" },
                    osuId: { type: "integer" },
                    username: { type: "string" },
                    groups: { type: "array", items: { $ref: "#/components/schemas/UserGroup" } },
                    coverUrl: { type: "string" },
                    country: { type: "object" },
                    avatarUrl: { type: "string" },
                    osuProfileUrl: { type: "string" },
                },
            },
            User: {
                type: "object",
                description: "Current user profile (`GET /api/users/me`). Some fields may be omitted when sanitized.",
                properties: {
                    _id: { type: "string" },
                    osuId: { type: "integer" },
                    username: { type: "string" },
                    groups: { type: "array", items: { $ref: "#/components/schemas/UserGroup" } },
                    discordId: { type: "string" },
                    isActiveReviewer: { type: "boolean" },
                    isActiveVoter: { type: "boolean" },
                    coverUrl: { type: "string" },
                    country: { type: "object" },
                    badgeValue: { type: "integer" },
                    avatarUrl: { type: "string" },
                    osuProfileUrl: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Tournament: {
                type: "object",
                description:
                    "Tournament document. Committee-only fields are censored for API key owners without committee access.",
                properties: {
                    _id: { type: "string" },
                    name: { type: "string" },
                    modes: { type: "array", items: { $ref: "#/components/schemas/GameMode" } },
                    startDate: { type: ["string", "null"], format: "date-time" },
                    endDate: { type: ["string", "null"], format: "date-time" },
                    forumUrl: { type: "string" },
                    hosts: { type: "array", items: { $ref: "#/components/schemas/UserSummary" } },
                    type: { $ref: "#/components/schemas/TournamentType" },
                    status: { $ref: "#/components/schemas/TournamentStatus" },
                    isActive: { type: "boolean" },
                    bannerUrl: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                    statusString: { type: "string" },
                    winners: { type: "array", items: { $ref: "#/components/schemas/UserSummary" } },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            TournamentListResponse: {
                type: "object",
                properties: {
                    tournaments: { type: "array", items: { $ref: "#/components/schemas/Tournament" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pages: { type: "integer" },
                },
            },
            TournamentDetailResponse: {
                type: "object",
                properties: {
                    tournament: { $ref: "#/components/schemas/Tournament" },
                },
            },
            VotingCategory: {
                type: "string",
                enum: ["tournament", "user", "discussion"],
            },
            Voting: {
                type: "object",
                description: "Voting document. Non-committee keys receive a censored public view.",
                properties: {
                    _id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    publicDescription: { type: "string" },
                    category: { $ref: "#/components/schemas/VotingCategory" },
                    assignedGroups: { type: "array", items: { $ref: "#/components/schemas/UserGroup" } },
                    isActive: { type: "boolean" },
                    isPublic: { type: "boolean" },
                    type: {
                        type: "string",
                        enum: ["variable", "binary", "classic", "binary-strict", "ranked-choice"],
                    },
                    options: { type: "array", items: { type: "string" } },
                    duration: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                    concludedAt: { type: "string", format: "date-time" },
                    deadline: { type: "string", format: "date-time" },
                },
            },
            VotingListResponse: {
                type: "object",
                properties: {
                    votings: { type: "array", items: { $ref: "#/components/schemas/Voting" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pages: { type: "integer" },
                },
            },
            ResourceCategory: {
                type: "string",
                enum: ["discord", "tool", "guide", "spreadsheet", "article"],
            },
            ResourceType: {
                type: "string",
                enum: ["official", "community"],
            },
            Resource: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    author: { $ref: "#/components/schemas/UserSummary" },
                    category: { $ref: "#/components/schemas/ResourceCategory" },
                    type: { $ref: "#/components/schemas/ResourceType" },
                    link: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ResourceListResponse: {
                type: "object",
                properties: {
                    resources: { type: "array", items: { $ref: "#/components/schemas/Resource" } },
                    pagination: {
                        type: "object",
                        properties: {
                            current: { type: "integer" },
                            total: { type: "integer", description: "Total number of pages" },
                        },
                    },
                },
            },
            TicketType: {
                type: "string",
                enum: ["ticket", "report"],
            },
            Ticket: {
                type: "object",
                description: "Ticket or report. Sanitized for the requesting user.",
                properties: {
                    _id: { type: "string" },
                    type: { $ref: "#/components/schemas/TicketType" },
                    title: { type: "string" },
                    assignedGroup: { $ref: "#/components/schemas/UserGroup" },
                    isActive: { type: "boolean" },
                    author: { $ref: "#/components/schemas/UserSummary" },
                    targetUser: { $ref: "#/components/schemas/UserSummary" },
                    targetTournamentName: { type: "string" },
                    targetTournamentLink: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            TicketListResponse: {
                type: "object",
                properties: {
                    tickets: { type: "array", items: { $ref: "#/components/schemas/Ticket" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pages: { type: "integer" },
                },
            },
            ValidationResult: {
                type: "object",
                properties: {
                    beatmapIds: { type: "array", items: { type: "integer" } },
                    beatmapsetId: { type: "integer" },
                    complianceStatus: {
                        type: "integer",
                        enum: [0, 1, 2],
                        description: "0 = OK, 1 = potentially disallowed, 2 = disallowed",
                    },
                    complianceStatusString: { type: "string" },
                    complianceFailureReason: { type: "integer" },
                    complianceFailureReasonString: { type: "string" },
                    notes: { type: "string" },
                    cover: { type: "string" },
                    artist: { type: "string" },
                    title: { type: "string" },
                    ownerId: { type: "integer" },
                    ownerUsername: { type: "string" },
                    status: { type: "string" },
                },
            },
            ValidateBeatmapsResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    allowed: { type: "array", items: { $ref: "#/components/schemas/ValidationResult" } },
                    partial: { type: "array", items: { $ref: "#/components/schemas/ValidationResult" } },
                    disallowed: { type: "array", items: { $ref: "#/components/schemas/ValidationResult" } },
                    errors: {
                        type: "array",
                        items: { type: "string" },
                        description: "Beatmap IDs that were not found / failed lookup",
                    },
                },
            },
            StatusInfo: {
                type: "object",
                properties: {
                    version: {
                        type: "object",
                        properties: {
                            hash: { type: "string" },
                            message: { type: "string" },
                            branchStatus: { type: "string" },
                        },
                    },
                    osuApi: {
                        type: "object",
                        properties: {
                            status: { type: "string", enum: ["healthy", "down"] },
                            since: { type: ["string", "null"] },
                        },
                    },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: "Missing, invalid, or revoked API key",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            invalidKey: { value: { error: "Invalid or revoked API key" } },
                        },
                    },
                },
            },
            ForbiddenScope: {
                description: "API key missing required scope",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            missingScope: { value: { error: "Missing required scope" } },
                        },
                    },
                },
            },
            ForbiddenCors: {
                description: "Request blocked by CORS policy (browser origin without session/API key)",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            cors: {
                                value: {
                                    error: "Access denied. This endpoint is only accessible from the client application or with a valid API key.",
                                },
                            },
                        },
                    },
                },
            },
            RateLimited: {
                description: "API key rate limit exceeded (100 requests / 10 minutes)",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            rateLimit: {
                                value: { error: "Rate limit exceeded! (>100 requests in 10 minutes)" },
                            },
                        },
                    },
                },
            },
            BadRequest: {
                description: "Validation / bad request",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            validation: { value: { error: "Validation error" } },
                        },
                    },
                },
            },
            NotFound: {
                description: "Resource or route not found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            endpoint: { value: { error: "API endpoint not found" } },
                            object: { value: { error: "Object not found" } },
                        },
                    },
                },
            },
            ServerError: {
                description: "Unexpected server error",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        examples: {
                            generic: { value: { error: "Something went wrong!" } },
                        },
                    },
                },
            },
        },
    },
    paths: {
        "/api/compliance/validate": {
            post: {
                tags: ["Compliance"],
                summary: "Check beatmap compliance",
                description:
                    "Validate beatmap (not beatmapset) IDs and/or osu! beatmap URLs. " +
                    "Separators like spaces, commas, and newlines are supported.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["input"],
                                properties: {
                                    input: {
                                        type: "string",
                                        description: "Beatmap IDs and/or beatmap URLs",
                                        example: "1234567 https://osu.ppy.sh/b/7654321",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Results grouped by compliance status",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ValidateBeatmapsResponse" },
                            },
                        },
                    },
                    "400": { $ref: "#/components/responses/BadRequest" },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/tournaments": {
            get: {
                tags: ["Tournaments"],
                summary: "Search tournaments",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "search",
                        in: "query",
                        schema: { type: "string" },
                        description: "Search by name or tags",
                    },
                    {
                        name: "mode",
                        in: "query",
                        schema: { $ref: "#/components/schemas/GameMode" },
                        description: "Filter by game mode",
                    },
                    {
                        name: "host",
                        in: "query",
                        schema: { type: "string" },
                        description: "Host osu! username or ID",
                    },
                    {
                        name: "type",
                        in: "query",
                        schema: { $ref: "#/components/schemas/TournamentType" },
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: { $ref: "#/components/schemas/TournamentStatus" },
                        description: "Official support status",
                    },
                    {
                        name: "state",
                        in: "query",
                        schema: { $ref: "#/components/schemas/TournamentState" },
                        description: "Active / archived filter (`archived` and `concluded` both mean inactive)",
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Paginated tournament list (censored for non-committee keys)",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TournamentListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/tournaments/{tournamentId}": {
            get: {
                tags: ["Tournaments"],
                summary: "Get tournament by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "tournamentId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Tournament MongoDB document ID",
                    },
                ],
                responses: {
                    "200": {
                        description: "Tournament details (censored for non-committee keys)",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TournamentDetailResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/votes": {
            get: {
                tags: ["Votings"],
                summary: "Search votes",
                description: "Non-committee API keys only receive concluded public votes regardless of filters.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "title",
                        in: "query",
                        schema: { type: "string" },
                        description: "Search by title",
                    },
                    {
                        name: "category",
                        in: "query",
                        schema: { $ref: "#/components/schemas/VotingCategory" },
                    },
                    {
                        name: "assignedGroup",
                        in: "query",
                        schema: { type: "string", enum: ["tc", "cc"] },
                        description: "Filter by assigned group",
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Paginated voting list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/VotingListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/votes/{votingId}": {
            get: {
                tags: ["Votings"],
                summary: "Get vote by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "votingId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Voting MongoDB document ID",
                    },
                ],
                responses: {
                    "200": {
                        description: "Voting details (censored for non-committee keys)",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Voting" } },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": {
                        description: "Missing scope, or vote is not concluded/public for this key",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Error" } },
                        },
                    },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/resources": {
            get: {
                tags: ["Resources"],
                summary: "Get resources",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "search",
                        in: "query",
                        schema: { type: "string" },
                        description: "Search by title or description",
                    },
                    {
                        name: "author",
                        in: "query",
                        schema: { type: "string" },
                        description: "Author osu! username or ID",
                    },
                    {
                        name: "category",
                        in: "query",
                        schema: { $ref: "#/components/schemas/ResourceCategory" },
                    },
                    {
                        name: "type",
                        in: "query",
                        schema: { $ref: "#/components/schemas/ResourceType" },
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Paginated resource list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ResourceListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/users/me": {
            get: {
                tags: ["Users"],
                summary: "Get current user",
                description: "Returns the user profile that owns the API key.",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Authenticated user profile",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/User" } },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/tickets": {
            get: {
                tags: ["Tickets"],
                summary: "Search tickets/reports",
                description:
                    "Tickets and reports are the same entity (`type` field). " +
                    "Querying reports is restricted: with `type=report` you only get reports you own; other report filters are ignored for non-committee keys.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "type",
                        in: "query",
                        schema: { $ref: "#/components/schemas/TicketType" },
                    },
                    {
                        name: "title",
                        in: "query",
                        schema: { type: "string" },
                        description: "Search by title (and message content for tickets, min 3 chars)",
                    },
                    {
                        name: "assignedGroup",
                        in: "query",
                        schema: { type: "string", enum: ["tc", "cc"] },
                    },
                    {
                        name: "showOwn",
                        in: "query",
                        schema: { type: "string", enum: ["true", "false"] },
                        description: "When `true`, only tickets/reports authored by you",
                    },
                    {
                        name: "isActive",
                        in: "query",
                        schema: { type: "string", enum: ["true", "false"] },
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                ],
                responses: {
                    "200": {
                        description: "Paginated ticket/report list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TicketListResponse" },
                            },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/tickets/{ticketId}": {
            get: {
                tags: ["Tickets"],
                summary: "Get ticket/report by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "ticketId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Ticket/report MongoDB document ID",
                    },
                ],
                responses: {
                    "200": {
                        description: "Ticket/report details (sanitized)",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Ticket" } },
                        },
                    },
                    "401": { $ref: "#/components/responses/Unauthorized" },
                    "403": { $ref: "#/components/responses/ForbiddenScope" },
                    "404": { $ref: "#/components/responses/NotFound" },
                    "429": { $ref: "#/components/responses/RateLimited" },
                },
            },
        },
        "/api/status": {
            get: {
                tags: ["Status"],
                summary: "Service status",
                description: "Public health/version endpoint. No authentication required.",
                security: [],
                responses: {
                    "200": {
                        description: "Version and osu! API health",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/StatusInfo" } },
                        },
                    },
                },
            },
        },
    },
};

export default openApiSpec;
