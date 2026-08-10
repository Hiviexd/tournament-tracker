import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { apiKeyManagementLimiter } from "../../middlewares/rateLimiter";
import { ApiKeyService } from "../../services/ApiKeyService";
import { KeysController } from "./keys.controller";
import { KeysService } from "./keys.service";

@Module({
    controllers: [KeysController],
    providers: [KeysService, ApiKeyService],
    exports: [ApiKeyService],
})
export class KeysModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(apiKeyManagementLimiter).forRoutes(
            { path: "keys/create", method: RequestMethod.POST },
            { path: "keys/update", method: RequestMethod.PUT },
            { path: "keys/revoke", method: RequestMethod.POST },
            { path: "keys/revoke/:keyId", method: RequestMethod.POST },
        );
    }
}
