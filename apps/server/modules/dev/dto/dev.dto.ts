import { z } from "zod";

export const DevSessionUpdateBodySchema = z
    .object({
        mongoId: z.string().optional(),
        osuId: z.number().optional(),
        username: z.string().optional(),
    })
    .strip();

export type DevSessionUpdateBody = z.infer<typeof DevSessionUpdateBodySchema>;
