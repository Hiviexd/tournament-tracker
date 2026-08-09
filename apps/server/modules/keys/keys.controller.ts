import {
    Body,
    CanActivate,
    Controller,
    ExecutionContext,
    Get,
    HttpCode,
    HttpStatus,
    Injectable,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import type { IUser } from "@tc/types/User";
import { apiKeyManagementLimiter } from "../../middlewares/rateLimiter";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { IsDevGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { runExpressMiddleware } from "../guards/express-middleware";
import { KeysService } from "./keys.service";

@Injectable()
class ApiKeyManagementLimiterGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return await runExpressMiddleware(
            apiKeyManagementLimiter as (req: Request, res: Response, next: (err?: unknown) => void) => unknown,
            http.getRequest<Request>(),
            http.getResponse<Response>(),
        );
    }
}

@Controller("keys")
export class KeysController {
    constructor(private readonly keysService: KeysService) {}

    @Get()
    @UseGuards(IsLoggedInGuard)
    get(@CurrentUser() currentUser: IUser) {
        return this.keysService.get(currentUser);
    }

    @Get("all")
    @UseGuards(IsLoggedInGuard, IsDevGuard)
    getAll() {
        return this.keysService.getAll();
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    create(
        @Body() body: { name?: string; scopes?: ApiScope[]; isElevated?: boolean },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.create(body, currentUser, req.session);
    }

    @Put("update")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    update(
        @Body() body: { scopes?: ApiScope[] },
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.update(body, currentUser, req.session);
    }

    @Post("revoke")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard)
    revoke(@CurrentUser() currentUser: IUser, @Req() req: Request) {
        return this.keysService.revoke(currentUser, req.session);
    }

    @Post("revoke/:keyId")
    @UseGuards(ApiKeyManagementLimiterGuard, IsLoggedInGuard, IsDevGuard)
    revokeById(
        @Param("keyId") keyId: string,
        @Body("keyId") bodyKeyId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.revokeById(keyId ?? bodyKeyId, currentUser, req.session);
    }
}
