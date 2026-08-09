import { Controller, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { deprecate } from "../../middlewares/deprecate";

/** @deprecated Replaced with ComplianceModule — Express route always returned 410 first. */
@Controller("beatmaps")
export class BeatmapsNestController {
    @Post("check")
    check(@Req() req: Request, @Res() res: Response): void {
        deprecate(req, res, { newRoute: "/compliance/validate" });
    }
}
