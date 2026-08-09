import {
    CanActivate,
    ExecutionContext,
    Injectable,
    mixin,
    Type,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class IsLoggedInGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        await this.auth.ensureLoggedIn(http.getRequest<Request>(), http.getResponse<Response>());
        return true;
    }
}

@Injectable()
export class IsCommitteeGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    canActivate(context: ExecutionContext): boolean {
        const http = context.switchToHttp();
        this.auth.ensureCommittee(http.getRequest<Request>(), http.getResponse<Response>());
        return true;
    }
}

@Injectable()
export class IsAdminGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    canActivate(context: ExecutionContext): boolean {
        const http = context.switchToHttp();
        this.auth.ensureAdmin(http.getRequest<Request>(), http.getResponse<Response>());
        return true;
    }
}

@Injectable()
export class IsDevGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    canActivate(context: ExecutionContext): boolean {
        const http = context.switchToHttp();
        this.auth.ensureDev(http.getRequest<Request>(), http.getResponse<Response>());
        return true;
    }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const http = context.switchToHttp();
        await this.auth.optionalAuth(http.getRequest<Request>(), http.getResponse<Response>());
        return true;
    }
}

/** Factory wrapping requireScopes(...) as a Nest guard. */
export function RequireScopesGuard(scopes: ApiScope[]): Type<CanActivate> {
    @Injectable()
    class RequireScopesGuardMixin implements CanActivate {
        constructor(private readonly auth: AuthService) {}

        canActivate(context: ExecutionContext): boolean {
            const http = context.switchToHttp();
            this.auth.requireScopes(http.getResponse<Response>(), scopes);
            return true;
        }
    }
    return mixin(RequireScopesGuardMixin);
}
