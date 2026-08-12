import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { csrfTokenFetchLimiter } from "../../middlewares/rateLimiter";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import {
    IsAdminGuard,
    IsCommitteeGuard,
    IsDevGuard,
    IsLoggedInGuard,
    OptionalAuthGuard,
} from "../guards/auth.guards";

@Global()
@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        IsLoggedInGuard,
        IsCommitteeGuard,
        IsAdminGuard,
        IsDevGuard,
        OptionalAuthGuard,
    ],
    exports: [
        AuthService,
        IsLoggedInGuard,
        IsCommitteeGuard,
        IsAdminGuard,
        IsDevGuard,
        OptionalAuthGuard,
    ],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(csrfTokenFetchLimiter).forRoutes({ path: "auth/csrf", method: RequestMethod.GET });
    }
}
