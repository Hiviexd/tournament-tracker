import { Module } from "@nestjs/common";
import { VotingDomainService } from "../../services/VotingDomainService";
import { VotesController } from "./votes.controller";
import { VotesService } from "./votes.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [VotesController],
    providers: [VotesService, VotingDomainService],
    exports: [VotingDomainService],
})
export class VotesModule {}
