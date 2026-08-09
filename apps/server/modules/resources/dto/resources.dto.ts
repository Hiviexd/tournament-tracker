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
