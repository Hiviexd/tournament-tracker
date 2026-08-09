import { z } from "zod";

export const publicConfigSchema = z.object({
    discord: z.object({
        webhooks: z.object({
            main: z.object({
                serverId: z.string(),
            }),
        }),
    }),
    r2: z.object({
        baseUrl: z.string(),
    }),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;
