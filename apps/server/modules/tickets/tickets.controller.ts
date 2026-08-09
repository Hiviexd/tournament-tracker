import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import type { Request } from "express";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { defaultFilesInterceptor } from "../common/upload.interceptors";
import {
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import { TicketsService } from "./tickets.service";

@Controller("tickets")
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    index(
        @Query()
        query: {
            type?: string;
            title?: string;
            content?: string;
            targetUser?: string;
            targetTournament?: string;
            assignedGroup?: string;
            isActive?: string;
            showOwn?: string;
            page?: string;
        },
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.ticketsService.index(query, currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard)
    @UseInterceptors(defaultFilesInterceptor)
    create(
        @Body() body: Record<string, any>,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.ticketsService.create(body as any, files, currentUser, req.session);
    }

    @Get(":ticketId")
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    getTicket(@Param("ticketId") ticketId: string, @CurrentUser() currentUser?: IUser) {
        return this.ticketsService.getTicket(ticketId, currentUser);
    }

    @Patch(":ticketId/sendMessage")
    @UseGuards(IsLoggedInGuard)
    @UseInterceptors(defaultFilesInterceptor)
    sendMessage(
        @Param("ticketId") ticketId: string,
        @Body() body: { content: string; isNote?: string | boolean },
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.ticketsService.sendMessage(ticketId, body, files, currentUser, req.session);
    }

    @Patch(":ticketId/toggleStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleStatus(@Param("ticketId") ticketId: string, @CurrentUser() currentUser: IUser, @Req() req: Request) {
        return this.ticketsService.toggleStatus(ticketId, currentUser, req.session);
    }

    @Patch(":ticketId/updateThreadId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateThreadId(
        @Param("ticketId") ticketId: string,
        @Body("threadId") threadId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.ticketsService.updateThreadId(ticketId, threadId, currentUser, req.session);
    }

    @Patch(":ticketId/snooze")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    snoozeTicket(@Param("ticketId") ticketId: string, @CurrentUser() currentUser: IUser, @Req() req: Request) {
        return this.ticketsService.snoozeTicket(ticketId, currentUser, req.session);
    }

    @Patch(":ticketId/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    editReport(
        @Param("ticketId") ticketId: string,
        @Body()
        body: {
            targetUserId?: string;
            targetTournamentName?: string;
            targetTournamentLink?: string;
        },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.ticketsService.editReport(ticketId, body, currentUser, req.session);
    }
}
