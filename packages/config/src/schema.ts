import { z, ZodError } from "zod";
import { readFileSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const webhookSchema = z.object({
    id: z.string(),
    token: z.string(),
    channelId: z.string(),
    serverId: z.string(),
});

export const configSchema = z.object({
    connection: z.string().min(1),
    session: z.string().min(1),
    baseUrl: z.string().min(1),
    automation: z.boolean(),
    osuApp: z.object({
        id: z.number(),
        secret: z.string(),
        redirect: z.string(),
    }),
    osuBot: z.object({
        id: z.number(),
        secret: z.string(),
    }),
    discord: z.object({
        username: z.string(),
        avatar_url: z.string(),
        roles: z.object({
            tournament: z.string(),
            contest: z.string(),
        }),
        webhooks: z.object({
            main: webhookSchema,
            dev: webhookSchema,
        }),
    }),
    r2: z.object({
        accountId: z.string(),
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        bucketName: z.string(),
        baseUrl: z.string(),
        baseFolder: z.string(),
    }),
    complianceApi: z.object({
        url: z.string(),
        apiKey: z.string(),
    }),
    // Older config.json files omit this; Enchant stays off until configured.
    enchant: z
        .object({
            enabled: z.boolean(),
            sidebarSecret: z.string(),
        })
        .default({ enabled: false, sidebarSecret: "" }),
});

export type AppConfig = z.infer<typeof configSchema>;

function findRepoRoot(startDir: string): string {
    let dir = startDir;
    for (;;) {
        if (existsSync(join(dir, "pnpm-workspace.yaml")) || existsSync(join(dir, "config.json"))) {
            return dir;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            throw new Error("Could not find repository root containing config.json");
        }
        dir = parent;
    }
}

function formatConfigZodError(configPath: string, error: ZodError): Error {
    const lines = error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "(root)";
        const got =
            "received" in issue && issue.received !== undefined ? ` (received ${String(issue.received)})` : "";
        return `  - ${path}: ${issue.message}${got}`;
    });

    return new Error(
        `Invalid config.json at ${configPath}:\n${lines.join("\n")}\n` +
            `Compare with config.example.json and fill any missing keys.`,
    );
}

export function loadConfigFromDisk(): AppConfig {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = findRepoRoot(here);
    const configPath = resolve(root, "config.json");
    if (!existsSync(configPath)) {
        throw new Error(`Missing config.json at ${configPath}. Copy config.example.json and fill it in.`);
    }
    const raw = JSON.parse(readFileSync(configPath, "utf8"));
    const parsed = configSchema.safeParse(raw);
    if (!parsed.success) {
        throw formatConfigZodError(configPath, parsed.error);
    }
    return parsed.data;
}
