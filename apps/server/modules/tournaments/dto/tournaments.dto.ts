import { z } from "zod";
import {
    mongoIdSchema,
    optionalPositiveIntString,
    optionalQueryEnum,
    optionalQueryString,
} from "../../common/dto/zod-helpers";

const tournamentStatusValues = [
    "supportRequestReceived",
    "screeningConcluded",
    "reviewOngoing",
    "changesRequested",
    "onHold",
    "badgeApproved",
    "badgeRejected",
    "noBadgeRequested",
] as const;

export const TournamentIndexQuerySchema = z
    .object({
        search: optionalQueryString,
        mode: optionalQueryEnum(["osu", "taiko", "catch", "mania"]),
        host: optionalQueryString,
        type: optionalQueryEnum(["tournament", "contest"]),
        status: optionalQueryEnum([...tournamentStatusValues]),
        state: optionalQueryEnum(["active", "archived", "concluded", "all"]),
        showAllAssignedReviews: optionalQueryString,
        page: optionalPositiveIntString,
    })
    .strip();

export type TournamentIndexQuery = z.infer<typeof TournamentIndexQuerySchema>;

export const TournamentIdParamSchema = mongoIdSchema;

/** Flexible create/edit bags — field-level rules stay in the service. */
export const TournamentCreateBodySchema = z.record(z.unknown());
export type TournamentCreateBody = z.infer<typeof TournamentCreateBodySchema>;

export const TournamentEditBodySchema = z.record(z.unknown());
export type TournamentEditBody = z.infer<typeof TournamentEditBodySchema>;

export const TournamentBulkEditBodySchema = z
    .object({
        tournamentIds: z.array(z.string()).min(1, "tournamentIds must be a non-empty array"),
        status: z.enum(tournamentStatusValues).optional(),
        isActive: z.boolean().optional(),
    })
    .strip()
    .refine((body) => body.status !== undefined || body.isActive !== undefined, {
        message: "At least one field (status or isActive) is required",
    });

export type TournamentBulkEditBody = z.infer<typeof TournamentBulkEditBodySchema>;

export const TournamentReassignReviewerBodySchema = z
    .object({
        oldReviewerId: z.string().min(1, "Both old and new reviewer IDs are required"),
        newReviewerId: z.string().min(1, "Both old and new reviewer IDs are required"),
    })
    .strip();

export type TournamentReassignReviewerBody = z.infer<typeof TournamentReassignReviewerBodySchema>;

export const TournamentReviewerIdBodySchema = z
    .object({
        reviewerId: z.string().min(1, "reviewerId is required"),
    })
    .strip();

export type TournamentReviewerIdBody = z.infer<typeof TournamentReviewerIdBodySchema>;

export const TournamentSubmitReviewBodySchema = z
    .object({
        checklist: z
            .array(z.object({ checked: z.boolean() }).passthrough())
            .min(1, "Missing required fields"),
        comment: z.string().optional(),
        vote: z.enum(["approve", "changesRequested", "deny"], {
            errorMap: () => ({ message: "Invalid vote" }),
        }),
    })
    .strip();

export type TournamentSubmitReviewBody = z.infer<typeof TournamentSubmitReviewBodySchema>;

export const TournamentDownloadBadgesBodySchema = z
    .array(
        z
            .object({
                badgeId: z.string(),
                filename: z.string(),
            })
            .strip(),
    )
    .optional();

export type TournamentDownloadBadgesBody = z.infer<typeof TournamentDownloadBadgesBodySchema>;

export const TournamentUpdateThreadIdBodySchema = z
    .object({
        threadId: z.string().optional(),
    })
    .strip();

export type TournamentUpdateThreadIdBody = z.infer<typeof TournamentUpdateThreadIdBodySchema>;

export const TournamentCreateNoteBodySchema = z
    .object({
        content: z.string().optional(),
    })
    .strip();

export type TournamentCreateNoteBody = z.infer<typeof TournamentCreateNoteBodySchema>;
