import { Body, Controller, Header, Post, UseGuards } from "@nestjs/common";
import config from "@tc/config";
import { EnchantHmacGuard } from "./enchant-hmac.guard";
import { EnchantService } from "./enchant.service";

@Controller("enchant")
export class EnchantController {
    constructor(private readonly enchantService: EnchantService) {}

    @Post("sidebar")
    @UseGuards(EnchantHmacGuard)
    @Header("Content-Type", "text/html")
    async sidebar(@Body() body: { id?: unknown }): Promise<string> {
        if (!config.enchant?.enabled) {
            return "";
        }

        const ticketId = typeof body?.id === "string" ? body.id : "";
        if (!ticketId) {
            return "";
        }

        return this.enchantService.buildSidebarHtml(ticketId);
    }
}
