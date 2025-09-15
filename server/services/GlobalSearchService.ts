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

const DEFAULT_LIMIT = 5 as const;

class GlobalSearchService {
    /**
     * Parse search query to extract type and content
     * @param query The search query string
     * @returns Object with searchType and searchContent
     */
    public parseSearchQuery(query: string): { searchType: string | null; searchContent: string } {
        const typePrefixMatch = query.match(/^(\w+):(.+)$/);

        if (typePrefixMatch) {
            const [, type, content] = typePrefixMatch;
            return {
                searchType: type.toLowerCase(),
                searchContent: content.trim(),
            };
        }

        return {
            searchType: null,
            searchContent: query,
        };
    }

    /**
     * Search tournaments by title or tags or forum URL
     */
    public async searchTournaments(searchType: string | null, tournamentSearchQuery: any): Promise<ITournament[]> {
        if (searchType && searchType !== "tournament" && searchType !== "tournaments") {
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
    public async searchVotings(searchType: string | null, searchContent: string): Promise<IVoting[]> {
        if (
            searchType &&
            searchType !== "voting" &&
            searchType !== "votings" &&
            searchType !== "vote" &&
            searchType !== "votes"
        ) {
            return [];
        }

        return await Voting.find({
            $or: [
                { title: { $regex: searchContent, $options: "i" } },
                { description: { $regex: searchContent, $options: "i" } },
            ],
        })
            .select("_id title type isActive duration assignedGroups")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search tickets by title
     */
    public async searchTickets(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "ticket" && searchType !== "tickets") {
            return [];
        }

        return await Ticket.find({
            type: "ticket",
            title: { $regex: searchContent, $options: "i" },
        })
            .select("_id title isActive assignedGroup")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search reports by title
     */
    public async searchReports(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "report" && searchType !== "reports") {
            return [];
        }

        return await Ticket.find({
            type: "report",
            title: { $regex: searchContent, $options: "i" },
        })
            .select("_id title isActive assignedGroup")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search articles by title
     */
    public async searchArticles(searchType: string | null, searchContent: string): Promise<IArticle[]> {
        if (searchType && searchType !== "article" && searchType !== "articles") {
            return [];
        }

        return await Article.find({
            title: { $regex: searchContent, $options: "i" },
        })
            .select("_id title")
            .limit(DEFAULT_LIMIT)
            .lean();
    }

    /**
     * Search resources by title
     */
    public async searchResources(searchType: string | null, searchContent: string): Promise<IResource[]> {
        if (searchType && searchType !== "resource" && searchType !== "resources") {
            return [];
        }

        return await Resource.find({
            title: { $regex: searchContent, $options: "i" },
        })
            .select("_id title category link")
            .limit(DEFAULT_LIMIT)
            .lean();
    }
}

export default new GlobalSearchService();
