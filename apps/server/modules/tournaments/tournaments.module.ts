import { Module } from "@nestjs/common";
import { TournamentService } from "../../services/TournamentService";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [TournamentsController],
    providers: [TournamentsService, TournamentService],
    exports: [TournamentService],
})
export class TournamentsModule {}
