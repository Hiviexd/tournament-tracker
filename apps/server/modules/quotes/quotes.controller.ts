import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import QuotesController from "../../controllers/QuotesController";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("quotes")
export class QuotesNestController {
    @Get()
    async getRandomQuote(@Req() req: Request, @Res() res: Response): Promise<void> {
        await QuotesController.getRandomQuote(req, res);
    }

    @Get("all")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async getAllQuotes(@Req() req: Request, @Res() res: Response): Promise<void> {
        await QuotesController.getAllQuotes(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async createQuote(@Req() req: Request, @Res() res: Response): Promise<void> {
        await QuotesController.createQuote(req, res);
    }
}
