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
import type { Request } from "express";
import type { IUser, UpdateBadgeRequest, UpdateUserGroupsRequest, UserListQuery } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @UseGuards(OptionalAuthGuard)
    index(@Query() query: UserListQuery, @CurrentUser() currentUser?: IUser) {
        return this.usersService.index(query, currentUser);
    }

    @Get("me")
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
    create(@Body("userInput") userInput: string | undefined, @Req() req: Request) {
        return this.usersService.create(req.session.accessToken!, userInput, req.session);
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
        @Body() body: UpdateUserGroupsRequest,
        @Req() req: Request,
    ) {
        return this.usersService.updateUserGroups(userId, body.group, body.join, req.session);
    }

    @Patch(":userId/updateBadge")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    updateBadge(@Param("userId") userId: string, @Body() body: UpdateBadgeRequest, @Req() req: Request) {
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
        @Body("discordId") discordId: string,
        @Req() req: Request,
    ) {
        return this.usersService.updateDiscordId(userId, discordId, req.session);
    }

    @Patch(":userId/updateEmail")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    updateEmail(@Param("userId") userId: string, @Body("email") email: string, @Req() req: Request) {
        return this.usersService.updateEmail(userId, email, req.session);
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
