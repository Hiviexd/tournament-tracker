import { ITournament } from "@interfaces/Tournament";
import { IUser } from "@interfaces/User";
import { LeanDocument } from "mongoose";

class TournamentService {
    /**
     * Add a log to a tournament
     * @param tournament - The tournament to add the log to
     * @param user - The user who performed the action
     * @param action - The action to add to the log
     */
    public async addTournamentLog(tournament: ITournament, user: IUser, action: string, icon: string = "history") {
        tournament.logs.push({
            user,
            action,
            icon,
            createdAt: new Date(),
        });

        await tournament.save();
    }

    /**
     * Sanitizes tournament data based on user permissions
     * Removes sensitive fields from non-committee users
     */
    public sanitizeTournament(
        tournament: LeanDocument<ITournament>,
        user: IUser | undefined
    ): LeanDocument<ITournament> {
        if (!user || !user.isCommittee) {
            const sanitized = { ...tournament };
            sanitized.reviews = [];
            sanitized.assignedReviewers = [];
            sanitized.threadId = undefined;
            sanitized.enchantUrl = undefined;
            sanitized.notes = [];
            sanitized.logs = [];
            return sanitized;
        }

        return tournament;
    }
}

export default new TournamentService();
