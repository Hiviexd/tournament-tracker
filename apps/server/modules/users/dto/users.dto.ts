import { z } from "zod";

export const UsersCreateBodySchema = z
    .object({
        userInput: z.string().min(1, "userInput is required"),
    })
    .strip();

export type UsersCreateBody = z.infer<typeof UsersCreateBodySchema>;

export const UsersUpdateGroupsBodySchema = z
    .object({
        group: z.enum(["tc", "cc"], {
            errorMap: () => ({ message: "Invalid group" }),
        }),
        join: z.boolean(),
    })
    .strip();

export type UsersUpdateGroupsBody = z.infer<typeof UsersUpdateGroupsBodySchema>;

export const UsersUpdateBadgeBodySchema = z
    .object({
        increment: z.boolean(),
    })
    .strip();

export type UsersUpdateBadgeBody = z.infer<typeof UsersUpdateBadgeBodySchema>;

export const UsersUpdateDiscordIdBodySchema = z
    .object({
        discordId: z
            .string()
            .min(1, "discordId is required")
            .refine((value) => !Number.isNaN(Number(value)), "Invalid Discord ID!"),
    })
    .strip();

export type UsersUpdateDiscordIdBody = z.infer<typeof UsersUpdateDiscordIdBodySchema>;

export const UsersUpdateEmailBodySchema = z
    .object({
        email: z
            .string()
            .min(1, "email is required")
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Invalid email!"),
    })
    .strip();

export type UsersUpdateEmailBody = z.infer<typeof UsersUpdateEmailBodySchema>;
