import { Module } from "@nestjs/common";
import { ComplianceController } from "./compliance.controller";
import { ComplianceService } from "./compliance.service";
import { ComplianceApiService } from "../../services/ComplianceApiService";

@Module({
    controllers: [ComplianceController],
    providers: [ComplianceService, ComplianceApiService],
})
export class ComplianceModule {}
