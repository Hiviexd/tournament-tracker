import { Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import InfringementsController from "../../controllers/InfringementsController";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("infringements")
export class InfringementsNestController {
    @Get("watchlist")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async getWatchlist(@Req() req: Request, @Res() res: Response): Promise<void> {
        await InfringementsController.getWatchlist(req, res);
    }

    @Post("add")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async addInfringement(@Req() req: Request, @Res() res: Response): Promise<void> {
        await InfringementsController.addInfringement(req, res);
    }

    @Patch(":infringementId/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateInfringement(@Req() req: Request, @Res() res: Response): Promise<void> {
        await InfringementsController.updateInfringement(req, res);
    }
}
