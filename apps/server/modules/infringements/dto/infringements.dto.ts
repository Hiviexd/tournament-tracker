import { z } from "zod";
import { InfringementType } from "@tc/types/Infringement";

const dateInputSchema = z.union([z.string(), z.date()]);

export const InfringementsAddBodySchema = z
    .object({
        userIds: z.union([z.string(), z.array(z.string())]).optional(),
        type: z.nativeEnum(InfringementType),
        startDate: dateInputSchema.optional(),
        endDate: dateInputSchema.optional(),
        reason: z.string().min(1, "reason is required"),
        threadId: z.string().optional(),
        enchantUrl: z.string().optional(),
    })
    .strip();

export type InfringementsAddBody = z.infer<typeof InfringementsAddBodySchema>;

export const InfringementsUpdateBodySchema = z
    .object({
        userId: z.string().min(1, "userId is required"),
        startDate: dateInputSchema.optional(),
        endDate: dateInputSchema.optional(),
        reason: z.string().optional(),
        threadId: z.string().optional(),
        enchantUrl: z.string().optional(),
    })
    .strip();

export type InfringementsUpdateBody = z.infer<typeof InfringementsUpdateBodySchema>;
