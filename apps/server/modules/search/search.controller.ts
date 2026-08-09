import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import GlobalSearchController from "../../controllers/GlobalSearchController";
import { OptionalAuthGuard } from "../guards/auth.guards";

@Controller("search")
export class SearchNestController {
    @Get()
    @UseGuards(OptionalAuthGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await GlobalSearchController.index(req, res);
    }
}
