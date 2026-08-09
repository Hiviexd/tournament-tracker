import { Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import TemplatesController from "../../controllers/TemplatesController";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";

@Controller("templates")
@UseGuards(IsLoggedInGuard, IsCommitteeGuard)
export class TemplatesNestController {
    @Get()
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TemplatesController.index(req, res);
    }

    @Post("create")
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TemplatesController.create(req, res);
    }

    @Put(":id/update")
    async update(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TemplatesController.update(req, res);
    }

    @Delete(":id/delete")
    async delete(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TemplatesController.delete(req, res);
    }
}
