import { z } from "zod";

export const ComplianceValidateBodySchema = z
    .object({
        input: z.string().min(1, "input is required"),
    })
    .strip();

export type ComplianceValidateBody = z.infer<typeof ComplianceValidateBodySchema>;
