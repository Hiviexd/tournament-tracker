import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";
import { ComplianceService } from "./compliance.service";

@Controller("compliance")
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) {}

    @Post("validate")
    @UseGuards(RequireScopesGuard(["compliance:read"]), IsLoggedInGuard)
    validateBeatmaps(@Body("input") input: unknown, @CurrentUser() currentUser: IUser) {
        return this.complianceService.validateBeatmaps(input, currentUser);
    }
}
