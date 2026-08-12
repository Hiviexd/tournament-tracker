import { Module } from "@nestjs/common";
import { EnchantController } from "./enchant.controller";
import { EnchantHmacGuard } from "./enchant-hmac.guard";
import { EnchantService } from "./enchant.service";
import { EnchantSidebarService } from "../../services/EnchantSidebarService";

@Module({
    controllers: [EnchantController],
    providers: [EnchantService, EnchantHmacGuard, EnchantSidebarService],
})
export class EnchantModule {}
