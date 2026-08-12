import { Module } from "@nestjs/common";
import { TournamentDomainService } from "../../services/TournamentDomainService";
import { TournamentsController } from "./tournaments.controller";
import { TournamentsService } from "./tournaments.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [TournamentsController],
    providers: [TournamentsService, TournamentDomainService],
    exports: [TournamentDomainService],
})
export class TournamentsModule {}
