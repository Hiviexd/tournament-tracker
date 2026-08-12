import { z } from "zod";
import {
    optionalPositiveIntString,
    optionalQueryEnum,
    optionalQueryString,
} from "../../common/dto/zod-helpers";

export const ResourcesIndexQuerySchema = z
    .object({
        search: optionalQueryString,
        author: optionalQueryString,
        category: optionalQueryEnum(["discord", "tool", "guide", "spreadsheet", "article"]),
        type: optionalQueryEnum(["official", "community"]),
        page: optionalPositiveIntString,
    })
    .strip();

export type ResourcesIndexQuery = z.infer<typeof ResourcesIndexQuerySchema>;

export const ResourcesCreateBodySchema = z
    .object({
        title: z.string().min(1, "title is required"),
        description: z.string().min(1, "description is required"),
        category: z.enum(["discord", "tool", "guide", "spreadsheet", "article"]),
        type: z.enum(["official", "community"]),
        link: z.string().min(1, "link is required"),
        author: z.string().optional(),
    })
    .strip();

export type ResourcesCreateBody = z.infer<typeof ResourcesCreateBodySchema>;

export const ResourcesEditBodySchema = z
    .object({
        title: z.string().min(1, "title is required"),
        description: z.string().min(1, "description is required"),
        category: z.enum(["discord", "tool", "guide", "spreadsheet", "article"]),
        link: z.string().min(1, "link is required"),
        author: z.string().optional(),
    })
    .strip();

export type ResourcesEditBody = z.infer<typeof ResourcesEditBodySchema>;
