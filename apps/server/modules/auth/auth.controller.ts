import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import AuthController from "../../controllers/AuthController";

@Controller("auth")
export class AuthNestController {
    @Get("login")
    login(@Req() req: Request, @Res() res: Response): void {
        AuthController.login(req, res);
    }

    @Post("logout")
    logout(@Req() req: Request, @Res() res: Response): void {
        AuthController.logout(req, res);
    }

    @Get("callback")
    async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
        await AuthController.callback(req, res);
    }

    @Get("csrf")
    getCsrfToken(@Req() req: Request, @Res() res: Response): void {
        AuthController.getCsrfToken(req, res);
    }
}
