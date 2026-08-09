import { Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import TicketsController from "../../controllers/TicketsController";
import { handleUpload } from "../../middlewares/upload";
import {
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

@Controller("tickets")
export class TicketsNestController {
    @Get()
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    async index(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.index(req, res);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard)
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await runUpload(handleUpload, req, res);
        if (res.headersSent) return;
        await TicketsController.create(req, res);
    }

    @Get(":ticketId")
    @UseGuards(RequireScopesGuard(["tickets:read"]), OptionalAuthGuard)
    async getTicket(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.getTicket(req, res);
    }

    @Patch(":ticketId/sendMessage")
    @UseGuards(IsLoggedInGuard)
    async sendMessage(@Req() req: Request, @Res() res: Response): Promise<void> {
        await runUpload(handleUpload, req, res);
        if (res.headersSent) return;
        await TicketsController.sendMessage(req, res);
    }

    @Patch(":ticketId/toggleStatus")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async toggleStatus(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.toggleStatus(req, res);
    }

    @Patch(":ticketId/updateThreadId")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async updateThreadId(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.updateThreadId(req, res);
    }

    @Patch(":ticketId/snooze")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async snoozeTicket(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.snoozeTicket(req, res);
    }

    @Patch(":ticketId/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    async editReport(@Req() req: Request, @Res() res: Response): Promise<void> {
        await TicketsController.editReport(req, res);
    }
}
