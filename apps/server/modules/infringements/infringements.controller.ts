import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { InfringementType } from "@tc/types/Infringement";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
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
        @Body()
        body: {
            userIds?: string | string[];
            type: InfringementType;
            startDate?: string | Date;
            endDate?: string | Date;
            reason: string;
            threadId?: string;
            enchantUrl?: string;
        },
        @Req() req: Request,
    ) {
        return this.infringementsService.addInfringement(body, req.session);
    }

    @Patch(":infringementId/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateInfringement(
        @Param("infringementId") infringementId: string,
        @Body()
        body: {
            userId: string;
            startDate?: string | Date;
            endDate?: string | Date;
            reason?: string;
            threadId?: string;
            enchantUrl?: string;
        },
        @Req() req: Request,
    ) {
        return this.infringementsService.updateInfringement(infringementId, body, req.session);
    }
}
