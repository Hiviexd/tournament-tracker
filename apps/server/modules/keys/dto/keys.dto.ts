import { z } from "zod";
import { AvailableApiScopes } from "@tc/types/ApiKey";

export const KeysCreateBodySchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        scopes: z.array(z.nativeEnum(AvailableApiScopes)),
        isElevated: z.boolean().optional(),
    })
    .strip();

export type KeysCreateBody = z.infer<typeof KeysCreateBodySchema>;

export const KeysUpdateBodySchema = z
    .object({
        scopes: z.array(z.nativeEnum(AvailableApiScopes)),
    })
    .strip();

export type KeysUpdateBody = z.infer<typeof KeysUpdateBodySchema>;
