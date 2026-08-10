import { ARTICLE_MODEL, RESOURCE_MODEL, TICKET_MODEL, TOURNAMENT_MODEL, VOTING_MODEL } from "../modules/common/database.tokens";
import type { Model } from "mongoose";
import { Inject, Injectable } from "@nestjs/common";
import { ITournament } from "@tc/types/Tournament";
import { IVoting } from "@tc/types/Voting";
import { ITicket } from "@tc/types/Ticket";
import { IResource } from "@tc/types/Resource";
import { IArticle } from "@tc/types/Article";
import utils from "@tc/utils/server";
import { TicketDomainService } from "./TicketDomainService";

const DEFAULT_LIMIT = 5 as const;

@Injectable()
export class GlobalSearchService {
    constructor(
        @Inject(TOURNAMENT_MODEL) private readonly tournamentModel: Model<ITournament>,
        @Inject(VOTING_MODEL) private readonly votingModel: Model<IVoting>,
        @Inject(TICKET_MODEL) private readonly ticketModel: Model<ITicket>,
        @Inject(RESOURCE_MODEL) private readonly resourceModel: Model<IResource>,
        @Inject(ARTICLE_MODEL) private readonly articleModel: Model<IArticle>,
        private readonly ticketService: TicketDomainService
    ) {}

    /**
     * Search tournaments by title or tags or forum URL
     */
    public async searchTournaments(searchType: string | null, tournamentSearchQuery: any): Promise<ITournament[]> {
        if (searchType && searchType !== "tournament") {
            return [];
        }

        const effectiveLimit = searchType === "tournament" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        return tournamentSearchQuery.$and
            ? await this.tournamentModel.find({ $and: tournamentSearchQuery.$and })
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
        const query = {
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                    isCommitteeOrAdmin
                        ? { description: { $regex: utils.escapeRegexPattern(term), $options: "i" } }
                        : { publicDescription: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                ],
            })),
            ...(isCommitteeOrAdmin ? {} : { isPublic: true, isActive: false }),
        };

        return await this.votingModel.find(query)
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
            messageIds = await this.ticketService.searchMessageContent(searchContent);
        }

        return await this.ticketModel.find({
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
            messageIds = await this.ticketService.searchMessageContent(searchContent);
        }

        return await this.ticketModel.find({
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
    public async searchArticles(searchType: string | null, searchContent: string): Promise<IArticle[]> {
        if (searchType && searchType !== "article") {
            return [];
        }

        const effectiveLimit = searchType === "article" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await this.articleModel.find({
            $and: searchTerms.map((term) => ({
                $or: [
                    { title: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                    { content: { $regex: utils.escapeRegexPattern(term), $options: "i" } },
                ],
            })),
        })
            .select("_id title slug")
            .sort({ createdAt: -1 })
            .limit(effectiveLimit)
            .lean();
    }

    /**
     * Search resources by title
     */
    public async searchResources(searchType: string | null, searchContent: string): Promise<IResource[]> {
        if (searchType && searchType !== "resource") {
            return [];
        }

        const effectiveLimit = searchType === "resource" ? DEFAULT_LIMIT * 2 : DEFAULT_LIMIT;

        const searchTerms = utils.splitSearchTerms(searchContent);

        return await this.resourceModel.find({
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
