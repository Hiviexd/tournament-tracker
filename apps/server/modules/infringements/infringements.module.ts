import { Module } from "@nestjs/common";
import { InfringementsNestController } from "./infringements.controller";

@Module({
    controllers: [InfringementsNestController],
})
export class InfringementsModule {}
