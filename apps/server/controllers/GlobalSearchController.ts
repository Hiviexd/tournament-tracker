import { Request, Response } from "express";
import TournamentService from "../services/TournamentService";
import GlobalSearchService from "../services/GlobalSearchService";
import utils from "@tc/utils/server";

class GlobalSearchController {
    public async index(req: Request, res: Response) {
        const { query } = req.query;

        if (!utils.isString(query) || !query) {
            return res.status(400).json({ error: "No valid search query provided" });
        }

        const currentUser = res.locals!.user;

        try {
            // Parse type-specific search
            const searchTypes = utils.getSearchTypes({ user: currentUser, searchType: "backend" });
            const { searchType, searchContent } = utils.parseSearchQuery(query, searchTypes);

            const tournamentSearchQuery = TournamentService.createSearchQuery(searchContent);

            // Perform searches based on type
            const [tournaments, votings, tickets, reports, articles, resources] = await Promise.all([
                GlobalSearchService.searchTournaments(searchType, tournamentSearchQuery),
                GlobalSearchService.searchVotings(searchType, searchContent, currentUser?.isCommitteeOrAdmin ?? false),
                GlobalSearchService.searchTickets(searchType, searchContent),
                currentUser?.isCommitteeOrAdmin ? GlobalSearchService.searchReports(searchType, searchContent) : [],
                GlobalSearchService.searchArticles(searchType, searchContent, currentUser?.isCommitteeOrAdmin ?? false),
                GlobalSearchService.searchResources(searchType, searchContent),
            ]);

            res.json({
                tournaments,
                votings,
                tickets,
                reports,
                resources,
                articles,
            });
        } catch (error) {
            console.error("Global search error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new GlobalSearchController();
