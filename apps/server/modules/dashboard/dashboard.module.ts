import { Module } from "@nestjs/common";
import { DashboardNestController } from "./dashboard.controller";

@Module({
    controllers: [DashboardNestController],
})
export class DashboardModule {}
