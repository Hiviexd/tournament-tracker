/**
 * Hand-written OpenAPI overlay for Scalar docs at /api/docs.
 * Merged onto the Nest-generated document (guide prose, servers, tags, bearerAuth).
 * Paths/schemas come from @nestjs/swagger — see openapi.build.ts.
 */
export const openApiOverlay = {
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
                type: "http" as const,
                scheme: "bearer",
                description: "API key from Settings → API Keys (`Authorization: Bearer <key>`)",
            },
        },
    },
};

export default openApiOverlay;
