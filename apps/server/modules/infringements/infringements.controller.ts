import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
import {
    InfringementsAddBodySchema,
    InfringementsUpdateBodySchema,
    type InfringementsAddBody,
    type InfringementsUpdateBody,
} from "./dto/infringements.dto";
import { InfringementsService } from "./infringements.service";

@Controller("infringements")
export class InfringementsController {
    constructor(private readonly infringementsService: InfringementsService) {}

    @Get("watchlist")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    getWatchlist(@Query() query: Record<string, string | undefined>) {
        return this.infringementsService.getWatchlist(query);
    }

    @Post("add")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    addInfringement(
        @Body(ZodPipe(InfringementsAddBodySchema)) body: InfringementsAddBody,
        @Req() req: Request,
    ) {
        return this.infringementsService.addInfringement(body, req.session);
    }

    @Patch(":infringementId/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateInfringement(
        @Param("infringementId") infringementId: string,
        @Body(ZodPipe(InfringementsUpdateBodySchema)) body: InfringementsUpdateBody,
        @Req() req: Request,
    ) {
        return this.infringementsService.updateInfringement(infringementId, body, req.session);
    }
}
