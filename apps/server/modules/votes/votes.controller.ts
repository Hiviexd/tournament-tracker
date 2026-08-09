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
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { IUser } from "@tc/types/User";
import type { VotingListQuery } from "@tc/types/Voting";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { defaultFilesInterceptor } from "../common/upload.interceptors";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import {
    SubmitVoteBodySchema,
    VotingIdParamSchema,
    VotesIndexQuerySchema,
    type SubmitVoteBody,
    type VotesIndexQuery,
} from "./dto/votes.dto";
import { VotesService } from "./votes.service";

@ApiTags("Votings")
@Controller("votes")
export class VotesController {
    constructor(private readonly votesService: VotesService) {}

    @Get()
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Search votes" })
    @UseGuards(RequireScopesGuard(["votings:read"]), OptionalAuthGuard)
    index(@Query(ZodPipe(VotesIndexQuerySchema)) query: VotesIndexQuery, @CurrentUser() currentUser?: IUser) {
        return this.votesService.index(query as VotingListQuery, currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    @UseInterceptors(defaultFilesInterceptor)
    createVoting(
        @Body() body: Record<string, any>,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.votesService.createVoting(body as any, files, currentUser, req.session);
    }

    @Get(":votingId")
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Get vote by ID" })
    @UseGuards(RequireScopesGuard(["votings:read"]), OptionalAuthGuard)
    getVoting(
        @Param("votingId", ZodPipe(VotingIdParamSchema)) votingId: string,
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.votesService.getVoting(votingId, currentUser);
    }

    @Post(":votingId/submitVote")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    submitVote(
        @Param("votingId", ZodPipe(VotingIdParamSchema)) votingId: string,
        @Body(ZodPipe(SubmitVoteBodySchema)) body: SubmitVoteBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.votesService.submitVote(votingId, body, currentUser, req.session);
    }

    @Patch(":votingId/toggleStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleVotingStatus(@Param("votingId") votingId: string, @Req() req: Request) {
        return this.votesService.toggleVotingStatus(votingId, req.session);
    }

    @Put(":votingId/update")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateVoting(@Param("votingId") votingId: string, @Body() body: Record<string, any>, @Req() req: Request) {
        return this.votesService.updateVoting(votingId, body as any, req.session);
    }

    @Delete(":votingId/delete")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    deleteVoting(@Param("votingId") votingId: string, @Req() req: Request) {
        return this.votesService.deleteVoting(votingId, req.session);
    }

    @Patch(":votingId/togglePublic")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleVotingPublic(@Param("votingId") votingId: string, @Req() req: Request) {
        return this.votesService.toggleVotingPublic(votingId, req.session);
    }

    @Delete(":votingId/clearVotes")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    clearVotes(@Param("votingId") votingId: string, @Req() req: Request) {
        return this.votesService.clearVotes(votingId, req.session);
    }

    @Patch(":votingId/toggleAbstention")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleAbstention(
        @Param("votingId") votingId: string,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.votesService.toggleAbstention(votingId, currentUser, req.session);
    }
}
