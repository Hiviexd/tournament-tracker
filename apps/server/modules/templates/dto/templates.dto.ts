import { z } from "zod";

export const TemplatesCreateBodySchema = z
    .object({
        name: z.string().min(1, "Template name is required"),
        content: z.string().min(1, "Template content is required"),
        category: z.string().min(1, "Category is required"),
    })
    .strip();

export type TemplatesCreateBody = z.infer<typeof TemplatesCreateBodySchema>;

export const TemplatesUpdateBodySchema = z
    .object({
        name: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
    })
    .strip();

export type TemplatesUpdateBody = z.infer<typeof TemplatesUpdateBodySchema>;
