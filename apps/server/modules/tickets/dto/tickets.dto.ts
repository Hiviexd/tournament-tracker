import { z } from "zod";
import {
    mongoIdSchema,
    optionalPositiveIntString,
    optionalQueryEnum,
    optionalQueryString,
    optionalTrueFalseString,
} from "../../common/dto/zod-helpers";

export const TicketsIndexQuerySchema = z
    .object({
        type: optionalQueryEnum(["ticket", "report"]),
        title: optionalQueryString,
        content: optionalQueryString,
        targetUser: optionalQueryString,
        targetTournament: optionalQueryString,
        assignedGroup: optionalQueryEnum(["tc", "cc"]),
        isActive: optionalTrueFalseString,
        showOwn: optionalTrueFalseString,
        page: optionalPositiveIntString,
    })
    .strip();

export type TicketsIndexQuery = z.infer<typeof TicketsIndexQuerySchema>;

export const TicketIdParamSchema = mongoIdSchema;

export const TicketCreateBodySchema = z
    .object({
        title: z.string().optional(),
        message: z.string().min(1, "message is required"),
        type: z.enum(["ticket", "report"]),
        assignedGroup: z.string().optional(),
        targetUserId: z.string().optional(),
        targetTournamentName: z.string().optional(),
        targetTournamentLink: z.string().optional(),
    })
    .strip();

export type TicketCreateBody = z.infer<typeof TicketCreateBodySchema>;
