import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import User from "@tc/models/userModel";
import utils from "@tc/utils/server";
import OsuApiService from "@tc/osu/OsuApiService";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import type { IUser } from "@tc/types/User";

type RefreshFailureMode = "redirect" | "continue";

/**
 * Shared auth helpers for Nest guards: API-key gate, session load/refresh, role checks.
 * Still mirrors Express middleware outcomes (messages + admin/dev bypass).
 */
@Injectable()
export class AuthService {
    assertApiKeyAccess(res: Response): void {
        if (res.locals?.authMethod === "apiKey" && !res.locals?.isAccessibleViaKey) {
            throw new ForbiddenException("API is not accessible via key");
        }
    }

    requireScopes(res: Response, scopes: ApiScope[]): void {
        if (res.locals?.authMethod !== "apiKey") {
            return;
        }

        const apiKey = res.locals?.apiKey;
        if (!apiKey || apiKey.revokedAt) {
            throw new UnauthorizedException("Unauthorized");
        }

        const hasAll = scopes.every((s) => apiKey.scopes.includes(s));
        if (!hasAll) {
            res.locals!.isAccessibleViaKey = false;
            throw new ForbiddenException("Missing required scope");
        }

        res.locals!.isAccessibleViaKey = true;
    }

    attachUser(req: Request, res: Response, user: IUser): void {
        req.user = user;
        res.locals = res.locals || {};
        res.locals.user = user;
    }

    getUser(req: Request, res: Response): IUser | undefined {
        return req.user ?? res.locals?.user;
    }

    isPrivileged(user: IUser | null | undefined): boolean {
        return !!(user && (user.isAdmin || user.isDev));
    }

    throwUnauthorized(): never {
        throw new UnauthorizedException("Unauthorized, login first");
    }

    /**
     * Role-check failure: admins/devs bypass (same as Express `unauthorize`).
     */
    denyUnlessPrivileged(user: IUser | null | undefined): void {
        if (this.isPrivileged(user)) {
            return;
        }
        this.throwUnauthorized();
    }

    async loadUser(req: Request, res: Response): Promise<IUser | null> {
        return User.findById(req.session.mongoId || res.locals?.user?._id);
    }

    /**
     * Refresh osu! tokens when less than 2 hours remain.
     * - `redirect`: destroy session + redirect `/` then throw (isLoggedIn parity)
     * - `continue`: destroy session and return false (optionalAuth parity)
     */
    async refreshSessionIfNeeded(
        req: Request,
        res: Response,
        onFailure: RefreshFailureMode,
    ): Promise<boolean> {
        if (!req.session?.expireDate) {
            return true;
        }

        if (!(new Date() > new Date(req.session.expireDate - 2 * 3600 * 1000))) {
            return true;
        }

        const response = await OsuApiService.refreshToken(req.session.refreshToken!);

        if (!response || OsuApiService.isOsuResponseError(response)) {
            await new Promise<void>((resolve) => {
                req.session.destroy((error) => {
                    console.log(error);
                    resolve();
                });
            });

            if (onFailure === "redirect") {
                res.redirect("/");
                this.throwUnauthorized();
            }

            return false;
        }

        utils.setSession(req.session, response);
        return true;
    }

    async ensureLoggedIn(req: Request, res: Response): Promise<IUser> {
        this.assertApiKeyAccess(res);

        const user = await this.loadUser(req, res);
        if (!user) {
            this.throwUnauthorized();
        }

        await this.refreshSessionIfNeeded(req, res, "redirect");
        this.attachUser(req, res, user);
        return user;
    }

    async optionalAuth(req: Request, res: Response): Promise<IUser | null> {
        this.assertApiKeyAccess(res);

        if (!req.session || !req.session.mongoId) {
            return null;
        }

        const user = await this.loadUser(req, res);
        if (!user) {
            return null;
        }

        const refreshed = await this.refreshSessionIfNeeded(req, res, "continue");
        if (!refreshed) {
            return null;
        }

        this.attachUser(req, res, user);
        return user;
    }

    ensureCommittee(req: Request, res: Response): void {
        this.assertApiKeyAccess(res);
        const user = this.getUser(req, res);
        if (user?.isCommittee) {
            return;
        }
        this.denyUnlessPrivileged(user);
    }

    ensureAdmin(req: Request, res: Response): void {
        this.assertApiKeyAccess(res);
        const user = this.getUser(req, res);
        if (user?.isAdmin) {
            return;
        }
        this.denyUnlessPrivileged(user);
    }

    ensureDev(req: Request, res: Response): void {
        this.assertApiKeyAccess(res);
        const user = this.getUser(req, res);
        if (user?.isDev) {
            return;
        }
        this.denyUnlessPrivileged(user);
    }
}
