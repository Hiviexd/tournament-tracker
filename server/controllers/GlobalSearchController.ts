import { Request, Response } from "express";
import TournamentService from "../services/TournamentService";
import GlobalSearchService from "../services/GlobalSearchService";

class GlobalSearchController {
    public async index(req: Request, res: Response) {
        const { query } = req.query;

        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "No valid search query provided" });
        }

        try {
            // Parse type-specific search
            const { searchType, searchContent } = GlobalSearchService.parseSearchQuery(query as string);
            const tournamentSearchQuery = TournamentService.createSearchQuery(searchContent);

            // Perform searches based on type
            const [tournaments, votings, tickets, reports, articles, resources] = await Promise.all([
                GlobalSearchService.searchTournaments(searchType, tournamentSearchQuery),
                GlobalSearchService.searchVotings(searchType, searchContent),
                GlobalSearchService.searchTickets(searchType, searchContent),
                GlobalSearchService.searchReports(searchType, searchContent),
                GlobalSearchService.searchArticles(searchType, searchContent),
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
