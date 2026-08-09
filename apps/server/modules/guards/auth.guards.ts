import { CanActivate, ExecutionContext, Injectable, mixin, Type } from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import auth from "../../middlewares/auth";
import { requireScopes } from "../../middlewares/authenticateRequest";
import { runExpressMiddleware } from "./express-middleware";

@Injectable()
export class IsLoggedInGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return runExpressMiddleware(auth.isLoggedIn, http.getRequest<Request>(), http.getResponse<Response>());
    }
}

@Injectable()
export class IsCommitteeGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return runExpressMiddleware(auth.isCommittee, http.getRequest<Request>(), http.getResponse<Response>());
    }
}

@Injectable()
export class IsAdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return runExpressMiddleware(auth.isAdmin, http.getRequest<Request>(), http.getResponse<Response>());
    }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        return runExpressMiddleware(auth.optionalAuth, http.getRequest<Request>(), http.getResponse<Response>());
    }
}

/** Factory wrapping requireScopes(...) as a Nest guard. */
export function RequireScopesGuard(scopes: ApiScope[]): Type<CanActivate> {
    @Injectable()
    class RequireScopesGuardMixin implements CanActivate {
        async canActivate(context: ExecutionContext): Promise<boolean> {
            const http = context.switchToHttp();
            return runExpressMiddleware(
                requireScopes(scopes),
                http.getRequest<Request>(),
                http.getResponse<Response>(),
            );
        }
    }
    return mixin(RequireScopesGuardMixin);
}
