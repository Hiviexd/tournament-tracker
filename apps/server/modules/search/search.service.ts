import { BadRequestException, Injectable } from "@nestjs/common";
import { TournamentService } from "../../services/TournamentService";
import { GlobalSearchService } from "../../services/GlobalSearchService";
import utils from "@tc/utils/server";
import type { IUser } from "@tc/types/User";

@Injectable()
export class SearchService {
    constructor(
        private readonly tournamentService: TournamentService,
        private readonly globalSearchService: GlobalSearchService,
    ) {}

    async index(query: unknown, currentUser: IUser | undefined) {
        if (!query || typeof query !== "string") {
            throw new BadRequestException("No valid search query provided");
        }

        const searchTypes = utils.getSearchTypes({ user: currentUser, searchType: "backend" });
        const { searchType, searchContent } = utils.parseSearchQuery(query, searchTypes);

        const tournamentSearchQuery = this.tournamentService.createSearchQuery(searchContent);

        const [tournaments, votings, tickets, reports, articles, resources] = await Promise.all([
            this.globalSearchService.searchTournaments(searchType, tournamentSearchQuery),
            this.globalSearchService.searchVotings(searchType, searchContent, currentUser?.isCommitteeOrAdmin ?? false),
            this.globalSearchService.searchTickets(searchType, searchContent),
            currentUser?.isCommitteeOrAdmin ? this.globalSearchService.searchReports(searchType, searchContent) : [],
            currentUser?.isCommitteeOrAdmin ? this.globalSearchService.searchArticles(searchType, searchContent) : [],
            this.globalSearchService.searchResources(searchType, searchContent),
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
