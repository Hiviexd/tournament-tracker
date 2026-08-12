import { Controller, GoneException, Post, Req } from "@nestjs/common";
import type { Request } from "express";

/** @deprecated Replaced with ComplianceModule — always returns 410. */
@Controller("beatmaps")
export class BeatmapsController {
    @Post("check")
    check(@Req() req: Request): never {
        let message = `Route "${req.originalUrl}" is deprecated and has been removed.`;
        message += ` Use "/api/compliance/validate" instead.`;

        console.warn(
            `User ${req.session?.username || "Unknown"} tried to access deprecated route "${req.originalUrl}"`,
        );

        throw new GoneException(message);
    }
}
