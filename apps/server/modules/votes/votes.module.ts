import { Module } from "@nestjs/common";
import { VotingService } from "../../services/VotingService";
import { VotesController } from "./votes.controller";
import { VotesService } from "./votes.service";

@Module({
    controllers: [VotesController],
    providers: [VotesService, VotingService],
    exports: [VotingService],
})
export class VotesModule {}
