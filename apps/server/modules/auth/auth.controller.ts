import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get("login")
    login(@Req() req: Request, @Res() res: Response): void {
        this.authService.login(req, res);
    }

    @Post("logout")
    logout(@Req() req: Request) {
        return this.authService.logout(req);
    }

    @Get("callback")
    async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
        await this.authService.callback(req, res);
    }

    @Get("csrf")
    getCsrfToken(@Req() req: Request) {
        return this.authService.getCsrfToken(req);
    }
}
