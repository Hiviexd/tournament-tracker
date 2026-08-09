import { Module } from "@nestjs/common";
import { InfringementsController } from "./infringements.controller";
import { InfringementsService } from "./infringements.service";

@Module({
    controllers: [InfringementsController],
    providers: [InfringementsService],
})
export class InfringementsModule {}
