import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodSchema, ZodError } from "zod";

function formatZodError(error: ZodError): string {
    const issue = error.errors[0];
    if (!issue) return "Validation error";

    const path = issue.path.length > 0 ? issue.path.join(".") : undefined;
    return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * Thin Nest pipe that parses values with a Zod schema and throws
 * BadRequestException (shaped as `{ error: string }` by AllExceptionsFilter).
 */
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: ZodSchema) {}

    transform(value: unknown) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new BadRequestException({ error: formatZodError(result.error) });
        }
        return result.data;
    }
}

/** Convenience factory matching `@Query(ZodPipe(Schema))` style usage. */
export function ZodPipe(schema: ZodSchema) {
    return new ZodValidationPipe(schema);
}
