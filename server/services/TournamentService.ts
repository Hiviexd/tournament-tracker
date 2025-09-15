import { ITournament } from "@interfaces/Tournament";
import { IUser } from "@interfaces/User";
import { LeanDocument } from "mongoose";
import { IReview } from "@interfaces/Review";
import { ITicket } from "@interfaces/Ticket";
import { IVoting } from "@interfaces/Voting";
import Ticket from "../models/ticketModel";
import Voting from "../models/votingModel";
import utils from "../../utils";

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
     * Sanitizes tournament listing data based on user permissions
     * Removes sensitive fields from non-committee users
     */
    public sanitizeTournamentListing(
        tournament: LeanDocument<ITournament>,
        user: IUser | undefined
    ): LeanDocument<ITournament> {
        if (!user || !user.isCommitteeOrAdmin) {
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

    /**
     * Censors reviews from non-committee users
     */
    public censorTournamentReviews(tournament: ITournament, user: IUser | undefined) {
        if (!user || !user.isCommitteeOrAdmin) {
            // outright clear the reviews array if the user is not the tournament host, or if the status is not changesRequested
            if (!user || !tournament.host._id.equals(user._id) || tournament.status !== "changesRequested") {
                tournament.reviews = [];
            } else {
                // Censor reviews
                if (tournament.reviews) {
                    tournament.reviews.forEach((review: IReview) => {
                        review.author = undefined;
                        review.comment = "";
                        review.vote = "changesRequested";
                    });
                }
            }
        }

        return tournament;
    }

    /**
     * Gets all reports related to a tournament by forum ID and tournament name
     * @param tournament The tournament to find related reports for
     * @returns Array of tickets that are reports related to this tournament
     */
    public async getRelatedReports(tournament: ITournament): Promise<ITicket[]> {
        const searchCriteria: any[] = [];

        // Search by forum ID if available
        if (tournament.forumUrl) {
            const forumId = utils.extractOsuForumId(tournament.forumUrl);
            if (forumId) {
                searchCriteria.push({
                    targetTournamentLink: { $regex: `/topics/${forumId}` },
                });
            }
        }

        // Search by tournament name
        if (tournament.name) {
            searchCriteria.push({
                targetTournamentName: { $regex: tournament.name, $options: "i" },
            });
        }

        if (searchCriteria.length === 0) {
            return [];
        }

        const reports = await Ticket.find({
            type: "report",
            $or: searchCriteria,
        }).populate([
            {
                path: "author",
                select: "username osuId groups coverUrl",
            },
        ]);

        return reports;
    }

    /**
     * Gets all votings related to a tournament by forum ID, tournament name, and voting title
     * @param tournament The tournament to find related votings for
     * @returns Array of votings related to this tournament
     */
    public async getRelatedVotings(tournament: ITournament): Promise<IVoting[]> {
        const searchCriteria: any[] = [];

        // Search by forum ID if available
        if (tournament.forumUrl) {
            const forumId = utils.extractOsuForumId(tournament.forumUrl);
            if (forumId) {
                searchCriteria.push({
                    targetTournamentLink: { $regex: `/topics/${forumId}` },
                });
            }
        }

        // Search by tournament name in voting title and targetTournamentName
        if (tournament.name) {
            searchCriteria.push(
                {
                    title: { $regex: tournament.name, $options: "i" },
                },
                {
                    targetTournamentName: { $regex: tournament.name, $options: "i" },
                }
            );
        }

        if (searchCriteria.length === 0) {
            return [];
        }

        const votings = await Voting.find({
            $or: searchCriteria,
        }).populate([
            {
                path: "author",
                select: "username osuId groups coverUrl",
            },
        ]);

        return votings;
    }

    /**
     * Creates a search query for tournaments based on search string
     * @param search The search string to process
     * @returns MongoDB query object for tournament search
     */
    public createSearchQuery(search: string): any {
        if (!search) {
            return {};
        }

        // Verify if search is a valid osu! forum URL, if so, use it to search for tournaments
        const forumId = utils.extractOsuForumId(search);
        if (forumId) {
            return { $and: [{ forumUrl: { $regex: forumId.toString() } }] };
        }

        // fallback to searching by name and tags
        const searchTerms = search
            .trim()
            .split(/\s+/)
            .filter((term) => term.length > 0);

        if (searchTerms.length === 0) {
            return {};
        }

        return {
            $and: searchTerms.map((term) => {
                const termRegex = new RegExp(term, "i");
                return {
                    $or: [{ name: termRegex }, { tags: { $in: [termRegex] } }],
                };
            }),
        };
    }
}

export default new TournamentService();
