import { Module } from "@nestjs/common";
import { EnchantController } from "./enchant.controller";
import { EnchantHmacGuard } from "./enchant-hmac.guard";
import { EnchantService } from "./enchant.service";

@Module({
    controllers: [EnchantController],
    providers: [EnchantService, EnchantHmacGuard],
})
export class EnchantModule {}
