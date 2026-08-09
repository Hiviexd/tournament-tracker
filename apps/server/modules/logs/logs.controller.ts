import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import LogsController from "../../controllers/LogsController";
import { IsAdminGuard, IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("logs")
export class LogsNestController {
    @Get()
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await LogsController.index(req, res);
    }

    @Get("export")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async exportCsv(@Req() req: Request, @Res() res: Response): Promise<void> {
        await LogsController.exportCsv(req, res);
    }
}
