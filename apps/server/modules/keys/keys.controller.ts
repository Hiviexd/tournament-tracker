import { CanActivate, ExecutionContext, Injectable, Controller, Get, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import ApiKeysController from "../../controllers/ApiKeysController";
import { apiKeyManagementLimiter } from "../../middlewares/rateLimiter";
import { IsDevGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { runExpressMiddleware } from "../guards/express-middleware";

@Injectable()
class ApiKeyManagementLimiterGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return runExpressMiddleware(
            apiKeyManagementLimiter as (req: Request, res: Response, next: (err?: unknown) => void) => unknown,
            http.getRequest<Request>(),
            http.getResponse<Response>(),
        );
    }
}

@Controller("keys")
export class KeysNestController {
    @Get()
    @UseGuards(IsLoggedInGuard)
    async get(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.get(req, res);
    }

    @Get("all")
    @UseGuards(IsLoggedInGuard, IsDevGuard)
    async getAll(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.getAll(req, res);
    }

    @Post("create")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    async create(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.create(req, res);
    }

    @Put("update")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    async update(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.update(req, res);
    }

    @Post("revoke")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    async revoke(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.revoke(req, res);
    }

    @Post("revoke/:keyId")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard, IsDevGuard)
    async revokeById(@Req() req: Request, @Res() res: Response): Promise<void> {
        await ApiKeysController.revokeById(req, res);
    }
}
