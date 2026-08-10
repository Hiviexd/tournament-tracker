import { Body, Controller, Header, Post, UseGuards } from "@nestjs/common";
import config from "@tc/config";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { EnchantSidebarBodySchema, type EnchantSidebarBody } from "./dto/enchant.dto";
import { EnchantHmacGuard } from "./enchant-hmac.guard";
import { EnchantService } from "./enchant.service";

@Controller("enchant")
export class EnchantController {
    constructor(private readonly enchantService: EnchantService) {}

    @Post("sidebar")
    @UseGuards(EnchantHmacGuard)
    @Header("Content-Type", "text/html")
    async sidebar(@Body(ZodPipe(EnchantSidebarBodySchema)) body: EnchantSidebarBody): Promise<string> {
        if (!config.enchant?.enabled) {
            return "";
        }

        const ticketId = body.id ?? "";
        if (!ticketId) {
            return "";
        }

        return await this.enchantService.buildSidebarHtml(ticketId);
    }
}
