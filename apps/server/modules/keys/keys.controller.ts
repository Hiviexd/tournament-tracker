import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsDevGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { KeysCreateBodySchema, KeysUpdateBodySchema, type KeysCreateBody, type KeysUpdateBody } from "./dto/keys.dto";
import { KeysService } from "./keys.service";

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
    @UseGuards(IsLoggedInGuard)
    create(
        @Body(ZodPipe(KeysCreateBodySchema)) body: KeysCreateBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.create(body, currentUser, req.session);
    }

    @Put("update")
    @UseGuards(IsLoggedInGuard)
    update(
        @Body(ZodPipe(KeysUpdateBodySchema)) body: KeysUpdateBody,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.update(body, currentUser, req.session);
    }

    @Post("revoke")
    @UseGuards(IsLoggedInGuard)
    revoke(@CurrentUser() currentUser: IUser, @Req() req: Request) {
        return this.keysService.revoke(currentUser, req.session);
    }

    @Post("revoke/:keyId")
    @UseGuards(IsLoggedInGuard, IsDevGuard)
    revokeById(
        @Param("keyId") keyId: string,
        @Body("keyId") bodyKeyId: string | undefined,
        @CurrentUser() currentUser: IUser,
        @Req() req: Request,
    ) {
        return this.keysService.revokeById(keyId ?? bodyKeyId, currentUser, req.session);
    }
}
