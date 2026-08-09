import { Controller, Delete, Get, Patch, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import VotingsController from "../../controllers/VotingsController";
import { handleUpload } from "../../middlewares/upload";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";

function runUpload(middleware: typeof handleUpload, req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
        let done = false;
        const finish = () => {
            if (!done) {
                done = true;
                resolve();
            }
        };
        // Upload middleware may respond with 400 without calling next()
        res.once("finish", finish);
        middleware(req, res, (err?: unknown) => {
            if (err) {
                done = true;
                reject(err instanceof Error ? err : new Error(String(err)));
                return;
            }
            finish();
        });
    });
}

@Controller("votes")
export class VotesNestController {
    @Get()
    @UseGuards(RequireScopesGuard(["votings:read"]), OptionalAuthGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.index(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async createVoting(@Req() req: Request, @Res() res: Response): Promise<void> {
        await runUpload(handleUpload, req, res);
        if (res.headersSent) return;
        await VotingsController.createVoting(req, res);
    }

    @Get(":votingId")
    @UseGuards(RequireScopesGuard(["votings:read"]), OptionalAuthGuard)
    async getVoting(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.getVoting(req, res);
    }

    @Post(":votingId/submitVote")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async submitVote(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.submitVote(req, res);
    }

    @Patch(":votingId/toggleStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleVotingStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.toggleVotingStatus(req, res);
    }

    @Put(":votingId/update")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateVoting(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.updateVoting(req, res);
    }

    @Delete(":votingId/delete")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async deleteVoting(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.deleteVoting(req, res);
    }

    @Patch(":votingId/togglePublic")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleVotingPublic(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.toggleVotingPublic(req, res);
    }

    @Delete(":votingId/clearVotes")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async clearVotes(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.clearVotes(req, res);
    }

    @Patch(":votingId/toggleAbstention")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleAbstention(@Req() req: Request, @Res() res: Response): Promise<void> {
        await VotingsController.toggleAbstention(req, res);
    }
}
