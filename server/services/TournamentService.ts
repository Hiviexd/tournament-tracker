import { ITournament } from "@interfaces/Tournament";
import { IUser } from "@interfaces/User";

class TournamentService {
    /**
     * Add a log to a tournament
     * @param tournament - The tournament to add the log to
     * @param user - The user who performed the action
     * @param action - The action to add to the log
     */
    public async addLog(tournament: ITournament, user: IUser, action: string, icon: string = "history") {
        tournament.logs.push({
            user,
            action,
            icon,
            createdAt: new Date(),
        });

        await tournament.save();
    }
}

export default new TournamentService();
