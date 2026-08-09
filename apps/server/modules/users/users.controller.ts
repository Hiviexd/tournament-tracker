import { Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import UsersController from "../../controllers/UsersController";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";

@Controller("users")
export class UsersNestController {
    @Get()
    @UseGuards(OptionalAuthGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.index(req, res);
    }

    @Get("me")
    @UseGuards(RequireScopesGuard(["users:read"]), IsLoggedInGuard)
    getSelf(@Req() req: Request, @Res() res: Response): void {
        UsersController.getSelf(req, res);
    }

    @Get("getCommittee")
    @UseGuards(OptionalAuthGuard)
    async getCommittee(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.getCommittee(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard)
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.create(req, res);
    }

    @Get(":userId/relatedReportsAndVotings")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async getRelatedReportsAndVotings(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.getRelatedReportsAndVotings(req, res);
    }

    @Get(":userInput")
    @UseGuards(OptionalAuthGuard)
    async getUser(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.getUser(req, res);
    }

    @Get(":userInput/osu")
    @UseGuards(IsLoggedInGuard)
    async getOsuUserInfo(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.getOsuUserInfo(req, res);
    }

    @Patch(":userId/toggleReviewerStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleReviewerStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.toggleReviewerStatus(req, res);
    }

    @Patch(":userId/toggleVoterStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleVoterStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.toggleVoterStatus(req, res);
    }

    @Patch(":userId/groupMove")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async updateUserGroups(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.updateUserGroups(req, res);
    }

    @Patch(":userId/updateBadge")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async updateBadge(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.updateBadge(req, res);
    }

    @Patch(":userId/sync")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async syncUser(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.syncUser(req, res);
    }

    @Patch(":userId/updateDiscordId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateDiscordId(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.updateDiscordId(req, res);
    }

    @Patch(":userId/updateEmail")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateEmail(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.updateEmail(req, res);
    }

    @Get(":userId/reviewStats")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async getReviewStats(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.getReviewStats(req, res);
    }

    @Patch("cycleBag")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async cycleBag(@Req() req: Request, @Res() res: Response): Promise<void> {
        await UsersController.cycleBag(req, res);
    }
}
