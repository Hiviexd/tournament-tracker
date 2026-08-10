import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { InfringementsModule } from "../infringements/infringements.module";

@Module({
    imports: [InfringementsModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
