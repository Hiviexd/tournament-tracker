import { z } from "zod";

export const EnchantSidebarBodySchema = z
    .object({
        id: z.string().optional(),
    })
    .strip();

export type EnchantSidebarBody = z.infer<typeof EnchantSidebarBodySchema>;
