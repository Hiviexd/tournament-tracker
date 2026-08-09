import { BadRequestException, Injectable } from "@nestjs/common";
import TournamentService from "../../services/TournamentService";
import GlobalSearchService from "../../services/GlobalSearchService";
import utils from "@tc/utils/server";
import type { IUser } from "@tc/types/User";

@Injectable()
export class SearchService {
    async index(query: unknown, currentUser: IUser | undefined) {
        if (!query || typeof query !== "string") {
            throw new BadRequestException("No valid search query provided");
        }

        const searchTypes = utils.getSearchTypes({ user: currentUser, searchType: "backend" });
        const { searchType, searchContent } = utils.parseSearchQuery(query, searchTypes);

        const tournamentSearchQuery = TournamentService.createSearchQuery(searchContent);

        const [tournaments, votings, tickets, reports, articles, resources] = await Promise.all([
            GlobalSearchService.searchTournaments(searchType, tournamentSearchQuery),
            GlobalSearchService.searchVotings(searchType, searchContent, currentUser?.isCommitteeOrAdmin ?? false),
            GlobalSearchService.searchTickets(searchType, searchContent),
            currentUser?.isCommitteeOrAdmin ? GlobalSearchService.searchReports(searchType, searchContent) : [],
            currentUser?.isCommitteeOrAdmin ? GlobalSearchService.searchArticles(searchType, searchContent) : [],
            GlobalSearchService.searchResources(searchType, searchContent),
        ]);

        return {
            tournaments,
            votings,
            tickets,
            reports,
            resources,
            articles,
        };
    }
}
