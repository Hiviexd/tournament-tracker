import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import DashboardController from "../../controllers/DashboardController";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("dashboard")
export class DashboardNestController {
    @Get()
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await DashboardController.index(req, res);
    }
}
