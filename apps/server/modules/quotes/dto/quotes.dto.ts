import { z } from "zod";

export const QuotesCreateBodySchema = z
    .object({
        authorId: z.string().min(1, "Author is required"),
        quote: z.string().min(1, "Quote is required"),
    })
    .strip();

export type QuotesCreateBody = z.infer<typeof QuotesCreateBodySchema>;
