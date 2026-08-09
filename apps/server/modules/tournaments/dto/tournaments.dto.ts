import { z } from "zod";
import {
    mongoIdSchema,
    optionalPositiveIntString,
    optionalQueryEnum,
    optionalQueryString,
} from "../../common/dto/zod-helpers";

export const TournamentIndexQuerySchema = z
    .object({
        search: optionalQueryString,
        mode: optionalQueryEnum(["osu", "taiko", "catch", "mania"]),
        host: optionalQueryString,
        type: optionalQueryEnum(["tournament", "contest"]),
        status: optionalQueryEnum([
            "supportRequestReceived",
            "screeningConcluded",
            "reviewOngoing",
            "changesRequested",
            "onHold",
            "badgeApproved",
            "badgeRejected",
            "noBadgeRequested",
        ]),
        state: optionalQueryEnum(["active", "archived", "concluded", "all"]),
        showAllAssignedReviews: optionalQueryString,
        page: optionalPositiveIntString,
    })
    .strip();

export type TournamentIndexQuery = z.infer<typeof TournamentIndexQuerySchema>;

export const TournamentIdParamSchema = mongoIdSchema;

export const TournamentCreateBodySchema = z.record(z.unknown());
