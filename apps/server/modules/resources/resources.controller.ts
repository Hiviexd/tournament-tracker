import { Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import ResourcesController from "../../controllers/ResourcesController";
import { IsCommitteeGuard, IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";

@Controller("resources")
export class ResourcesNestController {
    @Get()
    @UseGuards(RequireScopesGuard(["resources:read"]))
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ResourcesController.index(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ResourcesController.create(req, res);
    }

    @Put(":id/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async edit(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ResourcesController.edit(req, res);
    }

    @Delete(":id/delete")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async delete(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ResourcesController.delete(req, res);
    }
}
