import { Module } from "@nestjs/common";
import { TournamentsNestController } from "./tournaments.controller";

@Module({
    controllers: [TournamentsNestController],
})
export class TournamentsModule {}
