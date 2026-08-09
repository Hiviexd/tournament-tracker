import { Module } from "@nestjs/common";
import { ComplianceNestController } from "./compliance.controller";

@Module({
    controllers: [ComplianceNestController],
})
export class ComplianceModule {}
