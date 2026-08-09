import { z } from "zod";

/** Treat empty query strings as omitted. */
function omitEmpty<T extends z.ZodTypeAny>(schema: T) {
    return z
        .union([schema, z.literal("")])
        .optional()
        .transform((value) => (value === "" || value === undefined ? undefined : value));
}

export const optionalQueryString = omitEmpty(z.string()) as z.ZodType<string | undefined>;

export const optionalPositiveIntString = omitEmpty(
    z.string().regex(/^[1-9]\d*$/, "must be a positive integer"),
) as z.ZodType<string | undefined>;

export const optionalTrueFalseString = omitEmpty(z.enum(["true", "false"])) as z.ZodType<
    "true" | "false" | undefined
>;

export function optionalQueryEnum<const T extends readonly [string, ...string[]]>(
    values: T,
): z.ZodType<T[number] | undefined> {
    return omitEmpty(z.enum(values as unknown as [string, ...string[]])) as z.ZodType<
        T[number] | undefined
    >;
}

/** MongoDB ObjectId path param. */
export const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");
