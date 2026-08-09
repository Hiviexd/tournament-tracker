import { Module } from "@nestjs/common";
import { BeatmapsNestController } from "./beatmaps.controller";

@Module({
    controllers: [BeatmapsNestController],
})
export class BeatmapsModule {}
