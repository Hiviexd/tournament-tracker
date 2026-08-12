import { Module } from "@nestjs/common";
import { InfringementsController } from "./infringements.controller";
import { InfringementsService } from "./infringements.service";
import { InfringementService } from "../../services/InfringementService";

@Module({
    controllers: [InfringementsController],
    providers: [InfringementsService, InfringementService],
    exports: [InfringementService],
})
export class InfringementsModule {}
