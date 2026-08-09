import { Controller, Delete, Get, Patch, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import TournamentsController from "../../controllers/TournamentsController";
import { createUploadMiddleware, handleUpload } from "../../middlewares/upload";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
    RequireScopesGuard,
} from "../guards/auth.guards";

const tournamentBadgeUpload = createUploadMiddleware({
    maxFiles: 8,
    allowedTypes: ["image/jpeg", "image/png"],
});

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

@Controller("tournaments")
export class TournamentsNestController {
    @Get()
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.index(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.create(req, res);
    }

    @Patch("bulkEdit")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async bulkEdit(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.bulkEdit(req, res);
    }

    @Get(":tournamentId")
    @UseGuards(RequireScopesGuard(["tournaments:read"]), OptionalAuthGuard)
    async getTournament(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.getTournament(req, res);
    }

    @Put(":tournamentId/edit")
    @UseGuards(IsLoggedInGuard)
    async edit(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.edit(req, res);
    }

    @Patch(":tournamentId/assignReviewers")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async assignReviewers(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.assignReviewers(req, res);
    }

    @Patch(":tournamentId/reassignReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async reassignReviewer(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.reassignReviewer(req, res);
    }

    @Patch(":tournamentId/addReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async addReviewer(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.addReviewer(req, res);
    }

    @Patch(":tournamentId/removeReviewer")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async removeReviewer(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.removeReviewer(req, res);
    }

    @Patch(":tournamentId/submitReview")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async submitReview(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.submitReview(req, res);
    }

    @Post(":tournamentId/uploadBadges")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async uploadBadges(@Req() req: Request, @Res() res: Response): Promise<void> {
        await runUpload(tournamentBadgeUpload, req, res);
        if (res.headersSent) return;
        await TournamentsController.uploadBadges(req, res);
    }

    @Post(":tournamentId/downloadBadges")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async downloadBadges(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.downloadBadges(req, res);
    }

    @Patch(":tournamentId/updateThreadId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateThreadId(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.updateThreadId(req, res);
    }

    @Post(":tournamentId/createNote")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async createNote(@Req() req: Request, @Res() res: Response): Promise<void> {
        await runUpload(handleUpload, req, res);
        if (res.headersSent) return;
        await TournamentsController.createNote(req, res);
    }

    @Delete(":tournamentId/delete")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    async delete(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TournamentsController.delete(req, res);
    }
}
