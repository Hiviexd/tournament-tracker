import { Controller, Get, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import StatusController from "../../controllers/StatusController";

@Controller("status")
export class StatusNestController {
    @Get()
    async getStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
        await StatusController.getStatus(req, res);
    }
}
