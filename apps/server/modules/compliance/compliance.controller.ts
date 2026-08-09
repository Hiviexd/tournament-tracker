import { Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import ComplianceController from "../../controllers/ComplianceController";
import { IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";

@Controller("compliance")
export class ComplianceNestController {
    @Post("validate")
    @UseGuards(RequireScopesGuard(["compliance:read"]), IsLoggedInGuard)
    async validateBeatmaps(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ComplianceController.validateBeatmaps(req, res);
    }
}
