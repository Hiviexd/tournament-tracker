import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { IUser, UserListQuery } from "@tc/types/User";
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
    UsersCreateBodySchema,
    UsersUpdateBadgeBodySchema,
    UsersUpdateDiscordIdBodySchema,
    UsersUpdateEmailBodySchema,
    UsersUpdateGroupsBodySchema,
    type UsersCreateBody,
    type UsersUpdateBadgeBody,
    type UsersUpdateDiscordIdBody,
    type UsersUpdateEmailBody,
    type UsersUpdateGroupsBody,
} from "./dto/users.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @UseGuards(OptionalAuthGuard)
    index(@Query() query: UserListQuery, @CurrentUser() currentUser?: IUser) {
        return this.usersService.index(query, currentUser);
    }

    @Get("me")
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({
        summary: "Get current user",
        description: "Returns the user profile that owns the API key.",
    })
    @UseGuards(RequireScopesGuard(["users:read"]), IsLoggedInGuard)
    getSelf(@CurrentUser() currentUser: IUser) {
        return this.usersService.getSelf(currentUser);
    }

    @Get("getCommittee")
    @UseGuards(OptionalAuthGuard)
    getCommittee(
        @Query("type") type: string | undefined,
        @Query("includeAlumni") includeAlumni: string | undefined,
        @CurrentUser() currentUser?: IUser,
    ) {
        return this.usersService.getCommittee(type, includeAlumni === "true", currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard)
    create(@Body(ZodPipe(UsersCreateBodySchema)) body: UsersCreateBody, @Req() req: Request) {
        return this.usersService.create(req.session.accessToken!, body.userInput, req.session);
    }

    @Patch("cycleBag")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    cycleBag(@Req() req: Request) {
        return this.usersService.cycleBag(req.session);
    }

    @Get(":userId/relatedReportsAndVotings")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    getRelatedReportsAndVotings(@Param("userId") userId: string) {
        return this.usersService.getRelatedReportsAndVotings(userId);
    }

    @Get(":userInput/osu")
    @UseGuards(IsLoggedInGuard)
    getOsuUserInfo(@Param("userInput") userInput: string, @Req() req: Request) {
        return this.usersService.getOsuUserInfo(req.session.accessToken!, userInput);
    }

    @Patch(":userId/toggleReviewerStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleReviewerStatus(@Param("userId") userId: string, @Req() req: Request) {
        return this.usersService.toggleReviewerStatus(userId, req.session);
    }

    @Patch(":userId/toggleVoterStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    toggleVoterStatus(@Param("userId") userId: string, @Req() req: Request) {
        return this.usersService.toggleVoterStatus(userId, req.session);
    }

    @Patch(":userId/groupMove")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    updateUserGroups(
        @Param("userId") userId: string,
        @Body(ZodPipe(UsersUpdateGroupsBodySchema)) body: UsersUpdateGroupsBody,
        @Req() req: Request,
    ) {
        return this.usersService.updateUserGroups(userId, body.group, body.join, req.session);
    }

    @Patch(":userId/updateBadge")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    updateBadge(
        @Param("userId") userId: string,
        @Body(ZodPipe(UsersUpdateBadgeBodySchema)) body: UsersUpdateBadgeBody,
        @Req() req: Request,
    ) {
        return this.usersService.updateBadge(userId, body.increment, req.session);
    }

    @Patch(":userId/sync")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    syncUser(@Param("userId") userId: string, @Req() req: Request) {
        return this.usersService.syncUser(userId, req.session.accessToken!);
    }

    @Patch(":userId/updateDiscordId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateDiscordId(
        @Param("userId") userId: string,
        @Body(ZodPipe(UsersUpdateDiscordIdBodySchema)) body: UsersUpdateDiscordIdBody,
        @Req() req: Request,
    ) {
        return this.usersService.updateDiscordId(userId, body.discordId, req.session);
    }

    @Patch(":userId/updateEmail")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateEmail(
        @Param("userId") userId: string,
        @Body(ZodPipe(UsersUpdateEmailBodySchema)) body: UsersUpdateEmailBody,
        @Req() req: Request,
    ) {
        return this.usersService.updateEmail(userId, body.email, req.session);
    }

    @Get(":userId/reviewStats")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    getReviewStats(@Param("userId") userId: string, @Query("days") days?: string) {
        return this.usersService.getReviewStats(userId, days);
    }

    @Get(":userInput")
    @UseGuards(OptionalAuthGuard)
    getUser(@Param("userInput") userInput: string, @CurrentUser() currentUser?: IUser) {
        return this.usersService.getUser(userInput, currentUser);
    }
}
