import { Module } from "@nestjs/common";
import { BeatmapsController } from "./beatmaps.controller";

@Module({
    controllers: [BeatmapsController],
})
export class BeatmapsModule {}
