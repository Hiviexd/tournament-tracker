import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsDevGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { DevSessionUpdateBodySchema, type DevSessionUpdateBody } from "./dto/dev.dto";
import { DevService } from "./dev.service";

@Controller("dev")
@UseGuards(IsLoggedInGuard, IsDevGuard)
export class DevController {
    constructor(private readonly devService: DevService) {}

    @Get("session")
    getSession(@Req() req: Request) {
        return this.devService.getSession(req.session);
    }

    @Post("session/update")
    updateSession(
        @Body(ZodPipe(DevSessionUpdateBodySchema)) body: DevSessionUpdateBody,
        @Req() req: Request,
    ) {
        return this.devService.updateSession(req.session, body);
    }

    @Get("notifications/stats")
    getNotificationQueueStats() {
        return this.devService.getNotificationQueueStats();
    }

    @Get("notifications")
    getNotificationJobsListing(
        @Query()
        query: {
            page?: string;
            status?: string;
            provider?: string;
            kind?: string;
            payload?: string;
        },
    ) {
        return this.devService.getNotificationJobsListing(query);
    }
}
