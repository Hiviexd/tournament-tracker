import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { csrfTokenFetchLimiter } from "../../middlewares/rateLimiter";
import { AuthNestController } from "./auth.controller";

@Module({
    controllers: [AuthNestController],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(csrfTokenFetchLimiter).forRoutes({ path: "auth/csrf", method: RequestMethod.GET });
    }
}
