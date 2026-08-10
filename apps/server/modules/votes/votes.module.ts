import { Module } from "@nestjs/common";
import { VotingService } from "../../services/VotingService";
import { VotesController } from "./votes.controller";
import { VotesService } from "./votes.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [VotesController],
    providers: [VotesService, VotingService],
    exports: [VotingService],
})
export class VotesModule {}
