import { z } from "zod";
import {
    mongoIdSchema,
    optionalPositiveIntString,
    optionalQueryEnum,
    optionalQueryString,
} from "../../common/dto/zod-helpers";

export const VotesIndexQuerySchema = z
    .object({
        title: optionalQueryString,
        category: optionalQueryEnum(["tournament", "user", "discussion"]),
        assignedGroup: optionalQueryEnum(["tc", "cc"]),
        status: optionalQueryString,
        showNeedsAttention: optionalQueryString,
        visibility: optionalQueryString,
        page: optionalPositiveIntString,
    })
    .strip();

export type VotesIndexQuery = z.infer<typeof VotesIndexQuerySchema>;

export const VotingIdParamSchema = mongoIdSchema;

const voteScoreEntrySchema = z.object({
    optionIndex: z.number(),
    score: z.number(),
});

export const SubmitVoteBodySchema = z
    .object({
        data: z.discriminatedUnion("type", [
            z.object({ type: z.literal("classic"), option: z.number() }),
            z.object({ type: z.literal("binary"), score: z.number() }),
            z.object({ type: z.literal("binary-strict"), score: z.number() }),
            z.object({ type: z.literal("variable"), scores: z.array(voteScoreEntrySchema) }),
            z.object({ type: z.literal("ranked-choice"), scores: z.array(voteScoreEntrySchema) }),
        ]),
        comment: z.string().optional(),
    })
    .strip();

export type SubmitVoteBody = z.infer<typeof SubmitVoteBodySchema>;
