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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { defaultFilesInterceptor } from "../common/upload.interceptors";
import {
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import {
    TicketCreateBodySchema,
    TicketIdParamSchema,
    TicketsIndexQuerySchema,
    type TicketCreateBody,
    type TicketsIndexQuery,
} from "./dto/tickets.dto";
import { TicketsService } from "./tickets.service";

@ApiTags("Tickets")
@Controller("tickets")
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({
        summary: "Search tickets/reports",
        description:
            "Tickets and reports are the same entity (`type` field). " +
            "Querying reports is restricted: with `type=report` you only get reports you own; other report filters are ignored for non-committee keys.",
    })
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    index(
        @Query(ZodPipe(TicketsIndexQuerySchema)) query: TicketsIndexQuery,
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.ticketsService.index(query, currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard)
    @UseInterceptors(defaultFilesInterceptor)
    create(
        @Body(ZodPipe(TicketCreateBodySchema)) body: TicketCreateBody,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.ticketsService.create(body, files, currentUser, req.session);
    }

    @Get(":ticketId")
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Get ticket/report by ID" })
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    getTicket(
        @Param("ticketId", ZodPipe(TicketIdParamSchema)) ticketId: string,
        @CurrentUser() currentUser?: IUser,
    ) {
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
