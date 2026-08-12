import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { GlobalSearchService } from "../../services/GlobalSearchService";
import { TournamentsModule } from "../tournaments/tournaments.module";
import { TicketsModule } from "../tickets/tickets.module";

@Module({
    imports: [TournamentsModule, TicketsModule],
    controllers: [SearchController],
    providers: [SearchService, GlobalSearchService],
})
export class SearchModule {}
