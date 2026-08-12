import { z } from "zod";

export const ArticlesCreateBodySchema = z
    .object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
        type: z.enum(["documentation", "resource"]),
        isPublic: z.boolean().optional(),
    })
    .strip();

export type ArticlesCreateBody = z.infer<typeof ArticlesCreateBodySchema>;

export const ArticlesEditBodySchema = z
    .object({
        title: z.string().optional(),
        content: z.string().optional(),
    })
    .strip();

export type ArticlesEditBody = z.infer<typeof ArticlesEditBodySchema>;
