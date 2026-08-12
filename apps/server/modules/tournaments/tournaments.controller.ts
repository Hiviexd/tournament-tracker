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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import {
    TournamentBulkEditBodySchema,
    TournamentCreateBodySchema,
    TournamentCreateNoteBodySchema,
    TournamentDownloadBadgesBodySchema,
    TournamentEditBodySchema,
    TournamentIdParamSchema,
    TournamentIndexQuerySchema,
    TournamentReassignReviewerBodySchema,
    TournamentReviewerIdBodySchema,
    TournamentSubmitReviewBodySchema,
    TournamentUpdateThreadIdBodySchema,
    type TournamentBulkEditBody,
    type TournamentCreateBody,
    type TournamentCreateNoteBody,
    type TournamentDownloadBadgesBody,
    type TournamentEditBody,
    type TournamentIndexQuery,
    type TournamentReassignReviewerBody,
    type TournamentReviewerIdBody,
    type TournamentSubmitReviewBody,
    type TournamentUpdateThreadIdBody,
} from "./dto/tournaments.dto";
import { defaultFilesInterceptor, tournamentBadgeFilesInterceptor } from "./tournaments-upload";
import { TournamentsService } from "./tournaments.service";

@ApiTags("Tournaments")
@Controller("tournaments")
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Search tournaments" })
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    index(
        @Query(ZodPipe(TournamentIndexQuerySchema)) query: TournamentIndexQuery,
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.tournamentsService.index(query, currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    create(
        @Body(ZodPipe(TournamentCreateBodySchema)) body: TournamentCreateBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.create(body, currentUser, req.session);
    }

    @Patch("bulkEdit")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    bulkEdit(
        @Body(ZodPipe(TournamentBulkEditBodySchema)) body: TournamentBulkEditBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.bulkEdit(body, currentUser, req.session);
    }

    @Get(":tournamentId")
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Get tournament by ID" })
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    getTournament(
        @Param("tournamentId", ZodPipe(TournamentIdParamSchema)) tournamentId: string,
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.tournamentsService.getTournament(tournamentId, currentUser);
    }

    @Put(":tournamentId/edit")
    @UseGuards(IsLoggedInGuard)
    edit(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentEditBodySchema)) body: TournamentEditBody,
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
        @Body(ZodPipe(TournamentReassignReviewerBodySchema)) body: TournamentReassignReviewerBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.reassignReviewer(tournamentId, body, currentUser, req.session);
    }

    @Patch(":tournamentId/addReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    addReviewer(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentReviewerIdBodySchema)) body: TournamentReviewerIdBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.addReviewer(tournamentId, body.reviewerId, currentUser, req.session);
    }

    @Patch(":tournamentId/removeReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    removeReviewer(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentReviewerIdBodySchema)) body: TournamentReviewerIdBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.removeReviewer(tournamentId, body.reviewerId, currentUser, req.session);
    }

    @Patch(":tournamentId/submitReview")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    submitReview(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentSubmitReviewBodySchema)) body: TournamentSubmitReviewBody,
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
        @Body(ZodPipe(TournamentDownloadBadgesBodySchema)) body: TournamentDownloadBadgesBody,
        @Res({ passthrough: false }) res: Response,
    ): Promise<void> {
        await this.tournamentsService.downloadBadges(tournamentId, body, res);
    }

    @Patch(":tournamentId/updateThreadId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateThreadId(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentUpdateThreadIdBodySchema)) body: TournamentUpdateThreadIdBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.updateThreadId(tournamentId, body.threadId, currentUser, req.session);
    }

    @Post(":tournamentId/createNote")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    @UseInterceptors(defaultFilesInterceptor)
    createNote(
        @Param("tournamentId") tournamentId: string,
        @Body(ZodPipe(TournamentCreateNoteBodySchema)) body: TournamentCreateNoteBody,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.tournamentsService.createNote(tournamentId, body.content, files, currentUser, req.session);
    }

    @Delete(":tournamentId/delete")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    delete(@Param("tournamentId") tournamentId: string) {
        return this.tournamentsService.delete(tournamentId);
    }
}
