import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import config from "@tc/config";
import { EnchantService } from "./enchant.service";

/**
 * Verifies `enchant-signature` HMAC against `req.rawBody`.
 * When Enchant is disabled, allows the request through (controller returns empty body).
 */
@Injectable()
export class EnchantHmacGuard implements CanActivate {
    constructor(private readonly enchantService: EnchantService) {}

    canActivate(context: ExecutionContext): boolean {
        if (!config.enchant?.enabled) {
            return true;
        }

        const req = context.switchToHttp().getRequest<Request>();
        const signature = req.headers["enchant-signature"];
        const signatureValue = Array.isArray(signature) ? signature[0] : signature;

        if (!this.enchantService.verifySignature(req.rawBody, signatureValue)) {
            throw new UnauthorizedException("Unauthorized");
        }

        return true;
    }
}
