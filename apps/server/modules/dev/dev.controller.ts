import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import DevController from "../../controllers/DevController";
import { IsDevGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("dev")
@UseGuards(IsLoggedInGuard, IsDevGuard)
export class DevNestController {
    @Get("session")
    async getSession(@Req() req: Request, @Res() res: Response): Promise<void> {
        await DevController.getSession(req, res);
    }

    @Post("session/update")
    async updateSession(@Req() req: Request, @Res() res: Response): Promise<void> {
        await DevController.updateSession(req, res);
    }

    @Get("notifications/stats")
    async getNotificationQueueStats(@Req() req: Request, @Res() res: Response): Promise<void> {
        await DevController.getNotificationQueueStats(req, res);
    }

    @Get("notifications")
    async getNotificationJobsListing(@Req() req: Request, @Res() res: Response): Promise<void> {
        await DevController.getNotificationJobsListing(req, res);
    }
}
