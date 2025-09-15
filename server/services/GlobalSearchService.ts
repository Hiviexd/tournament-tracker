import Tournament from "../models/tournamentModel";
import { ITournament } from "../../interfaces/Tournament";
import Voting from "../models/votingModel";
import { IVoting } from "../../interfaces/Voting";
import Ticket from "../models/ticketModel";
import { ITicket } from "../../interfaces/Ticket";
import Resource from "../models/resourceModel";
import { IResource } from "../../interfaces/Resource";
import Article from "../models/articleModel";
import { IArticle } from "../../interfaces/Article";
import utils from "../../utils";

const DEFAULT_LIMIT = 5 as const;

class GlobalSearchService {
    /**
     * Search tournaments by title or tags or forum URL
     */
    public async searchTournaments(searchType: string | null, tournamentSearchQuery: any): Promise<ITournament[]> {
        if (searchType && searchType !== "tournament") {
            return [];
        }

        return tournamentSearchQuery.$and
            ? await Tournament.find({ $and: tournamentSearchQuery.$and })
                  .select("_id name type status isActive")
                  .limit(DEFAULT_LIMIT)
                  .lean()
            : [];
    }

    /**
     * Search votes by title or description
     */
    public async searchVotings(
        searchType: string | null,
        searchContent: string,
        isCommitteeOrAdmin: boolean
    ): Promise<IVoting[]> {
        if (searchType && searchType !== "voting") {
            return [];
        }

        // split search content by spaces
        const searchTerms = utils.splitSearchTerms(searchContent);

        // if isCommitteeOrAdmin, search all votes by title or description
        // else search only public and inactive votes by title or public description
        const query = {
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: term, $options: "i" } },
                    isCommitteeOrAdmin
                        ? { description: { $regex: term, $options: "i" } }
                        : { publicDescription: { $regex: term, $options: "i" } },
                ],
            })),
            ...(isCommitteeOrAdmin ? {} : { isPublic: true, isActive: false }),
        };

        return await Voting.find(query)
            .select("_id title category isActive duration createdAt assignedGroups")
            .limit(DEFAULT_LIMIT);
    }

    /**
     * Search tickets by title only
     */
    public async searchTickets(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "ticket") {
            return [];
        }

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Ticket.find({
            type: "ticket",
            $and: searchTerms.map((term) => ({
                $or: [{ title: { $regex: term, $options: "i" } }],
            })),
        })
            .select("_id title isActive assignedGroup")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search reports by title
     */
    public async searchReports(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "report") {
            return [];
        }

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Ticket.find({
            type: "report",
            $and: searchTerms.map((term) => ({
                $or: [{ title: { $regex: term, $options: "i" } }],
            })),
        })
            .select("_id title isActive assignedGroup targetUser targetTournamentName")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search articles by title or content
     */
    public async searchArticles(searchType: string | null, searchContent: string): Promise<IArticle[]> {
        if (searchType && searchType !== "article") {
            return [];
        }

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Article.find({
            $and: searchTerms.map((term) => ({
                $or: [{ title: { $regex: term, $options: "i" } }, { content: { $regex: term, $options: "i" } }],
            })),
        })
            .select("_id title slug")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search resources by title
     */
    public async searchResources(searchType: string | null, searchContent: string): Promise<IResource[]> {
        if (searchType && searchType !== "resource") {
            return [];
        }

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Resource.find({
            $and: searchTerms.map((term) => ({
                $or: [{ title: { $regex: term, $options: "i" } }],
            })),
        })
            .select("_id title category link")
            .limit(DEFAULT_LIMIT)
            .lean();
    }
}

export default new GlobalSearchService();
