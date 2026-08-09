import { Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import ArticlesController from "../../controllers/ArticlesController";
import { IsAdminGuard, IsCommitteeGuard, IsLoggedInGuard, OptionalAuthGuard } from "../guards/auth.guards";

@Controller("articles")
export class ArticlesNestController {
    @Get("documentation")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async getDocumentation(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ArticlesController.getDocumentation(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async createArticle(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ArticlesController.createArticle(req, res);
    }

    @Get(":slug")
    @UseGuards(OptionalAuthGuard)
    async getArticle(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ArticlesController.getArticle(req, res);
    }

    @Put(":slug/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async editArticle(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ArticlesController.editArticle(req, res);
    }

    @Delete(":slug/delete")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async deleteArticle(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ArticlesController.deleteArticle(req, res);
    }
}
