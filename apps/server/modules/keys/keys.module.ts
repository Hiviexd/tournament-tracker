import { Module } from "@nestjs/common";
import { KeysController } from "./keys.controller";
import { KeysService } from "./keys.service";
import { ApiKeyService } from "../../services/ApiKeyService";

@Module({
    controllers: [KeysController],
    providers: [KeysService, ApiKeyService],
    exports: [ApiKeyService],
})
export class KeysModule {}
