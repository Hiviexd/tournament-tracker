import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";
import { ComplianceValidateBodySchema, type ComplianceValidateBody } from "./dto/compliance.dto";
import { ComplianceService } from "./compliance.service";

@Controller("compliance")
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) {}

    @Post("validate")
    @UseGuards(RequireScopesGuard(["compliance:read"]), IsLoggedInGuard)
    validateBeatmaps(
        @Body(ZodPipe(ComplianceValidateBodySchema)) body: ComplianceValidateBody,
        @CurrentUser() currentUser: IUser,
    ) {
        return this.complianceService.validateBeatmaps(body.input, currentUser);
    }
}
