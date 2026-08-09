import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import { defaultFilesInterceptor, tournamentBadgeFilesInterceptor } from "./tournaments-upload";
import { TournamentsService } from "./tournaments.service";

@Controller("tournaments")
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    index(
        @Query()
        query: {
            search?: string;
            mode?: string;
            host?: string;
            type?: string;
            status?: string;
            state?: string;
            showAllAssignedReviews?: string;
            page?: string;
        },
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.tournamentsService.index(query, currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    create(@Body() body: Record<string, unknown>, @CurrentUser() currentUser: IUser, @Req() req: Request) {
        return this.tournamentsService.create(body, currentUser, req.session);
    }

    @Patch("bulkEdit")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    bulkEdit(
        @Body()
        body: {
            tournamentIds?: string[];
            status?: import("@tc/types/Tournament").TournamentStatus;
            isActive?: boolean;
        },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.bulkEdit(body, currentUser, req.session);
    }

    @Get(":tournamentId")
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    getTournament(@Param("tournamentId") tournamentId: string, @CurrentUser() currentUser?: IUser) {
        return this.tournamentsService.getTournament(tournamentId, currentUser);
    }

    @Put(":tournamentId/edit")
    @UseGuards(IsLoggedInGuard)
    edit(
        @Param("tournamentId") tournamentId: string,
        @Body() body: Record<string, unknown>,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.edit(tournamentId, body, currentUser, req.session);
    }

    @Patch(":tournamentId/assignReviewers")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    assignReviewers(
        @Param("tournamentId") tournamentId: string,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.assignReviewers(tournamentId, currentUser, req.session);
    }

    @Patch(":tournamentId/reassignReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    reassignReviewer(
        @Param("tournamentId") tournamentId: string,
        @Body() body: { oldReviewerId?: string; newReviewerId?: string },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.reassignReviewer(tournamentId, body, currentUser, req.session);
    }

    @Patch(":tournamentId/addReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    addReviewer(
        @Param("tournamentId") tournamentId: string,
        @Body("reviewerId") reviewerId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.addReviewer(tournamentId, reviewerId, currentUser, req.session);
    }

    @Patch(":tournamentId/removeReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    removeReviewer(
        @Param("tournamentId") tournamentId: string,
        @Body("reviewerId") reviewerId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.removeReviewer(tournamentId, reviewerId, currentUser, req.session);
    }

    @Patch(":tournamentId/submitReview")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    submitReview(
        @Param("tournamentId") tournamentId: string,
        @Body() body: { checklist?: any[]; comment?: string; vote?: string },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.submitReview(tournamentId, body, currentUser, req.session);
    }

    @Post(":tournamentId/uploadBadges")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    @UseInterceptors(tournamentBadgeFilesInterceptor)
    uploadBadges(
        @Param("tournamentId") tournamentId: string,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.uploadBadges(tournamentId, files, currentUser, req.session);
    }

    @Post(":tournamentId/downloadBadges")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async downloadBadges(
        @Param("tournamentId") tournamentId: string,
        @Body() body: { badgeId: string; filename: string }[],
        @Res({ passthrough: false }) res: Response,
    ): Promise<void> {
        await this.tournamentsService.downloadBadges(tournamentId, body, res);
    }

    @Patch(":tournamentId/updateThreadId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateThreadId(
        @Param("tournamentId") tournamentId: string,
        @Body("threadId") threadId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.updateThreadId(tournamentId, threadId, currentUser, req.session);
    }

    @Post(":tournamentId/createNote")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    @UseInterceptors(defaultFilesInterceptor)
    createNote(
        @Param("tournamentId") tournamentId: string,
        @Body("content") content: string | undefined,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.createNote(tournamentId, content, files, currentUser, req.session);
    }

    @Delete(":tournamentId/delete")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    delete(@Param("tournamentId") tournamentId: string) {
        return this.tournamentsService.delete(tournamentId);
    }
}
