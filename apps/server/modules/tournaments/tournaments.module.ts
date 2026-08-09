import { Module } from "@nestjs/common";
import { TournamentService } from "../../services/TournamentService";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";

@Module({
    controllers: [TournamentsController],
    providers: [TournamentsService, TournamentService],
    exports: [TournamentService],
})
export class TournamentsModule {}
