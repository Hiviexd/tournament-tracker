import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";
import { ComplianceValidateBodySchema, type ComplianceValidateBody } from "./dto/compliance.dto";
import { ComplianceService } from "./compliance.service";

@ApiTags("Compliance")
@ApiBearerAuth("bearerAuth")
@Controller("compliance")
export class ComplianceController {
    constructor(private readonly complianceService: ComplianceService) {}

    @Post("validate")
    @ApiOperation({
        summary: "Check beatmap compliance",
        description:
            "Validate beatmap (not beatmapset) IDs and/or osu! beatmap URLs. " +
            "Separators like spaces, commas, and newlines are supported.",
    })
    @UseGuards(RequireScopesGuard(["compliance:read"]), IsLoggedInGuard)
    validateBeatmaps(
        @Body(ZodPipe(ComplianceValidateBodySchema)) body: ComplianceValidateBody,
        @CurrentUser() currentUser: IUser,
    ) {
        return this.complianceService.validateBeatmaps(body.input, currentUser);
    }
}
