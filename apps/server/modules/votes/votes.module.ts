import { Module } from "@nestjs/common";
import { VotesNestController } from "./votes.controller";

@Module({
    controllers: [VotesNestController],
})
export class VotesModule {}
