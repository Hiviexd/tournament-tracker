import Tournament from "../models/tournamentModel";
import { ITournament } from "@tc/types/Tournament";
import Voting from "../models/votingModel";
import { IVoting } from "@tc/types/Voting";
import Ticket from "../models/ticketModel";
import { ITicket } from "@tc/types/Ticket";
import TicketService from "./TicketService";
import Resource from "../models/resourceModel";
import { IResource } from "@tc/types/Resource";
import Article from "../models/articleModel";
import { IArticle } from "@tc/types/Article";
import utils from "@tc/utils/server";

const DEFAULT_LIMIT = 5 as const;

class GlobalSearchService {
    /**
     * Search tournaments by title or tags or forum URL
     */
    public async searchTournaments(searchType: string | null, tournamentSearchQuery: any): Promise<ITournament[]> {
        if (searchType && searchType !== "tournament") {
            return [];
        }

        const effectiveLimit = searchType === "tournament" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        return tournamentSearchQuery.$and
            ? await Tournament.find({ $and: tournamentSearchQuery.$and })
                  .select("_id name type status isActive")
                  .sort({ createdAt: -1 })
                  .limit(effectiveLimit)
                  .lean()
            : [];
    }

    /**
     * Search votes by title or description
     */
    public async searchVotings(
        searchType: string | null,
        searchContent: string,
        isCommitteeOrAdmin: boolean,
    ): Promise<IVoting[]> {
        if (searchType && searchType !== "voting") {
            return [];
        }

        const effectiveLimit = searchType === "voting" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        // split search content by spaces
        const searchTerms = utils.splitSearchTerms(searchContent);

        // if isCommitteeOrAdmin, search all votes by title or description
        // else search only public and inactive votes by title or public description
        const $and = searchTerms.map((term) => ({
            $or: [
                { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                isCommitteeOrAdmin
                    ? { description: { $regex: utils.escapeRegexPattern(term), $options: "i" } }
                    : { publicDescription: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
            ],
        }));
        const query = isCommitteeOrAdmin ? { $and } : { $and, isPublic: true, isActive: false };

        return await Voting.find(query)
            .select("_id title category isActive duration createdAt assignedGroups")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit);
    }

    /**
     * Search tickets by title only
     */
    public async searchTickets(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "ticket") {
            return [];
        }

        const effectiveLimit = searchType === "ticket" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        const searchTerms = utils.splitSearchTerms(searchContent);

        let messageIds: string[] = [];

        // Only search messages if searchType is specified, given this query is kinda expensive
        if (searchType === "ticket") {
            messageIds = await TicketService.searchMessageContent(searchContent);
        }

        return await Ticket.find({
            type: "ticket",
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                    ...(searchType === "ticket" ? [{ messages: { $in: messageIds } }] : []),
                ],
            })),
        })
            .select("_id title isActive assignedGroup")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit)
            .lean();
    }

    /**
     * Search reports by title
     */
    public async searchReports(searchType: string | null, searchContent: string): Promise<ITicket[]> {
        if (searchType && searchType !== "report") {
            return [];
        }

        const effectiveLimit = searchType === "report" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        const searchTerms = utils.splitSearchTerms(searchContent);

        let messageIds: string[] = [];

        if (searchType === "report") {
            messageIds = await TicketService.searchMessageContent(searchContent);
        }

        return await Ticket.find({
            type: "report",
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                    ...(searchType === "report" ? [{ messages: { $in: messageIds } }] : []),
                ],
            })),
        })
            .select("_id title isActive assignedGroup targetUser targetTournamentName")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit)
            .lean();
    }

    /**
     * Search articles by title or content
     */
    public async searchArticles(
        searchType: string | null,
        searchContent: string,
        isCommitteeOrAdmin: boolean,
    ): Promise<Pick<IArticle, "_id" | "title" | "slug" | "type">[]> {
        if (searchType && searchType !== "article" && searchType !== "news") {
            return [];
        }

        if (searchType === "article" && !isCommitteeOrAdmin) {
            return [];
        }

        const effectiveLimit = searchType === "article" || searchType === "news" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;
        const typeFilter =
            searchType === "news"
                ? { type: "news" }
                : searchType === "article"
                  ? { type: "documentation" }
                  : isCommitteeOrAdmin
                    ? { type: { $in: ["news", "documentation"] } }
                    : { type: "news" };

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Article.find({
            ...typeFilter,
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                    { content: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                ],
            })),
        })
            .select("_id title slug type")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit)
            .lean();
    }

    /**
     * Search resources by title
     */
    public async searchResources(
        searchType: string | null,
        searchContent: string,
    ): Promise<Pick<IResource, "_id" | "title" | "category" | "link">[]> {
        if (searchType && searchType !== "resource") {
            return [];
        }

        const effectiveLimit = searchType === "resource" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await Resource.find({
            $and: searchTerms.map((term) => ({
                $or: [{ title: { $regex: utils.escapeRegexPattern(term), $options: "i" } }],
            })),
        })
            .select("_id title category link")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit)
            .lean();
    }
}

export default new GlobalSearchService();
