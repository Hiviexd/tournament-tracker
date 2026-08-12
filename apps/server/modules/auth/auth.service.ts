import crypto from "crypto";
import {
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import config from "@tc/config";
import utils from "@tc/utils/server";
import OsuApiService from "@tc/osu/OsuApiService";
import UserService from "@tc/osu/UserService";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import type { IUser, IUserStatics } from "@tc/types/User";
import { USER_MODEL } from "../common/database.tokens";

type RefreshFailureMode = "redirect" | "continue";

/**
 * Shared auth helpers for Nest guards: API-key gate, session load/refresh, role checks.
 * Also owns osu! OAuth login/callback/logout and CSRF token issuance.
 * Still mirrors Express middleware outcomes (messages + admin/dev bypass).
 */
@Injectable()
export class AuthService {
    constructor(@Inject(USER_MODEL) private readonly userModel: IUserStatics) {}
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
        return await this.userModel.findById(req.session.mongoId || res.locals?.user?._id);
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

    /** GET CSRF token for session-auth flows */
    getCsrfToken(req: Request): { token: string } {
        if (!req.session || !req.session.mongoId) {
            throw new UnauthorizedException("Unauthorized");
        }
        const token = typeof req.csrfToken === "function" ? req.csrfToken() : undefined;
        if (!token) {
            throw new InternalServerErrorException("CSRF not initialized");
        }
        return { token };
    }

    /** osu! OAuth login — sets `_state` cookie and redirects to osu! */
    login(req: Request, res: Response): void {
        const state = crypto.randomBytes(48).toString("hex");
        res.cookie("_state", state, { httpOnly: true });
        const hashedState = Buffer.from(state).toString("base64");

        if (!req.session.lastPage) {
            req.session.lastPage = req.get("referer");
        }

        res.redirect(
            `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
                config.osuApp.id
            }&redirect_uri=${encodeURIComponent(config.osuApp.redirect)}&state=${hashedState}&scope=public+identify`,
        );
    }

    /** Destroy session and return JSON confirmation */
    async logout(req: Request): Promise<{ message: string }> {
        await new Promise<void>((resolve, reject) => {
            req.session.destroy((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
        return { message: "Logged out" };
    }

    /** osu! OAuth callback — validates state, sets session, redirects */
    async callback(req: Request, res: Response): Promise<void> {
        if (!req.query.code || req.query.error || !req.query.state) {
            res.status(500).redirect("/error");
            return;
        }

        const decodedState = Buffer.from(req.query.state.toString(), "base64").toString("ascii");
        const savedState = req.cookies._state;
        res.clearCookie("_state");

        if (decodedState !== savedState) {
            res.status(403).redirect("/error");
            return;
        }

        const tokenResponse = await OsuApiService.getToken(req.query.code.toString());

        if (OsuApiService.isOsuResponseError(tokenResponse)) {
            res.status(500).redirect("/error");
            return;
        }

        utils.setSession(req.session, tokenResponse);
        const userResponse = await OsuApiService.getLoggedInUserInfo(req.session.accessToken!);

        if (OsuApiService.isOsuResponseError(userResponse)) {
            await new Promise<void>((resolve) => {
                req.session.destroy(() => resolve());
            });
            res.status(500).redirect("/error");
            return;
        }

        const userLookup = await this.userModel.findOne({ osuId: userResponse.id });
        const user = await UserService.createOrUpdateUser(userResponse, userLookup);

        req.session.mongoId = user.id;
        req.session.osuId = user.osuId;
        req.session.username = user.username;

        const lastPage = req.session.lastPage || "/";
        req.session.lastPage = undefined;

        // Only redirect to same-origin or relative path to prevent open redirect
        const baseUrl = config.baseUrl?.trim() || "";
        let redirectTarget = "/";
        if (lastPage && typeof lastPage === "string") {
            const trimmed = lastPage.trim();
            if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
                redirectTarget = trimmed;
            } else if (baseUrl && trimmed.startsWith(baseUrl)) {
                try {
                    const u = new URL(trimmed);
                    redirectTarget = u.pathname + u.search;
                } catch {
                    redirectTarget = "/";
                }
            }
        }

        res.redirect(redirectTarget);
    }
}
