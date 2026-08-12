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

export const TicketSendMessageBodySchema = z
    .object({
        content: z
            .string()
            .min(10, "Message must be between 10 and 8000 characters")
            .max(8000, "Message must be between 10 and 8000 characters"),
        /** Multipart sends `"true"` / `"false"` strings. */
        isNote: z.union([z.boolean(), z.string()]).optional(),
    })
    .strip();

export type TicketSendMessageBody = z.infer<typeof TicketSendMessageBodySchema>;

export const TicketUpdateThreadIdBodySchema = z
    .object({
        threadId: z.string().optional(),
    })
    .strip();

export type TicketUpdateThreadIdBody = z.infer<typeof TicketUpdateThreadIdBodySchema>;

export const TicketEditReportBodySchema = z
    .object({
        targetUserId: z.string().optional(),
        targetTournamentName: z.string().optional(),
        targetTournamentLink: z.string().optional(),
    })
    .strip()
    .superRefine((body, ctx) => {
        const editingUser = body.targetUserId !== undefined;
        const editingTournament =
            body.targetTournamentName !== undefined || body.targetTournamentLink !== undefined;

        if (editingUser && editingTournament) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Cannot set both target user and target tournament",
            });
        } else if (!editingUser && !editingTournament) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must provide either target user or target tournament",
            });
        }
    });

export type TicketEditReportBody = z.infer<typeof TicketEditReportBodySchema>;
