import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import config from "@tc/config";
import User from "@tc/models/userModel";
import ApiKey from "@tc/models/apiKeyModel";
import Infringement from "@tc/models/infringementModel";
import Tournament from "@tc/models/tournamentModel";
import type { ApiScope } from "@tc/types/ApiKey";
import type { Request, Response } from "express";
import { AuthService } from "../../modules/auth/auth.service";
import { EnchantHmacGuard } from "../../modules/enchant/enchant-hmac.guard";
import { EnchantService } from "../../modules/enchant/enchant.service";
import { authenticateRequest } from "../../middlewares/authenticateRequest";
import { conditionalCsrf, handleCsrfError } from "../../middlewares/csrf";
import { ApiKeyService, bindApiKeyService } from "../../services/ApiKeyService";
import { EnchantSidebarService } from "../../services/EnchantSidebarService";
import { createMockUser } from "../utils/users";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function mockRes(locals: Record<string, unknown> = {}): Response {
    return { locals } as unknown as Response;
}

function mockReq(partial: Partial<Request> = {}): Request {
    return partial as unknown as Request;
}

describe("auth parity checklist", () => {
    const auth = new AuthService(User);

    describe("1. login session + /users/me path", () => {
        it("login sets _state cookie and redirects to osu! OAuth", () => {
            const cookies: Array<{ name: string; options: object }> = [];
            let redirectUrl = "";
            const req = mockReq({
                session: {} as Request["session"],
                get: () => undefined,
            });
            const res = {
                cookie: (name: string, _value: string, options: object) => {
                    cookies.push({ name, options });
                },
                redirect: (url: string) => {
                    redirectUrl = url;
                },
            } as unknown as Response;

            auth.login(req, res);

            expect(cookies).toEqual([{ name: "_state", options: { httpOnly: true } }]);
            expect(redirectUrl).toContain("https://osu.ppy.sh/oauth/authorize");
            expect(redirectUrl).toContain(`client_id=${config.osuApp.id}`);
        });

        it("ensureLoggedIn loads session user for /users/me-style guards", async () => {
            const user = createMockUser();
            const findById = vi.spyOn(User, "findById").mockResolvedValue(user as never);

            const req = mockReq({
                session: {
                    mongoId: user.id,
                    expireDate: Date.now() + 24 * 3600 * 1000,
                } as Request["session"],
            });
            const res = mockRes({ authMethod: "session", isAccessibleViaKey: false });

            const loaded = await auth.ensureLoggedIn(req, res);

            expect(loaded).toBe(user);
            expect(req.user).toBe(user);
            findById.mockRestore();
        });
    });

    describe("2. logout destroys session", () => {
        it("logout calls session.destroy and returns confirmation", async () => {
            let destroyed = false;
            const req = mockReq({
                session: {
                    destroy: (cb: (err?: Error) => void) => {
                        destroyed = true;
                        cb();
                    },
                } as Request["session"],
            });

            await expect(auth.logout(req)).resolves.toEqual({ message: "Logged out" });
            expect(destroyed).toBe(true);
        });
    });

    describe("3. CSRF on session mutations", () => {
        let app: express.Express;

        beforeEach(() => {
            app = express();
            app.use(express.json());
            app.use(
                session({
                    secret: "auth-parity-test-secret",
                    resave: false,
                    saveUninitialized: true,
                    cookie: { sameSite: "lax", httpOnly: true },
                }),
            );
            app.use((req, res, next) => {
                res.locals.authMethod = "session";
                req.session.mongoId = "user-mongo-id";
                next();
            });
            app.use(conditionalCsrf);
            app.get("/csrf", (req, res) => {
                res.json({ token: req.csrfToken!() });
            });
            app.post("/mutate", (_req, res) => {
                res.json({ ok: true });
            });
            app.use(handleCsrfError);
        });

        it("rejects mutating session requests with a bad CSRF token", async () => {
            const agent = request.agent(app);
            await agent.get("/csrf").expect(200);

            const res = await agent.post("/mutate").set("X-CSRF-Token", "not-a-real-token").expect(403);

            expect(res.body).toEqual({ error: "Invalid CSRF token" });
        });

        it("accepts mutating session requests with a valid CSRF token", async () => {
            const agent = request.agent(app);
            const csrf = await agent.get("/csrf").expect(200);

            await agent.post("/mutate").set("X-CSRF-Token", csrf.body.token).expect(200);
        });
    });

    describe("4–5. Bearer scopes default deny", () => {
        it("Bearer without requireScopes stays inaccessible (403)", () => {
            const res = mockRes({
                authMethod: "apiKey",
                isAccessibleViaKey: false,
                apiKey: { scopes: ["users:read"] as ApiScope[], revokedAt: null },
            });

            expect(() => auth.assertApiKeyAccess(res)).toThrow(ForbiddenException);
            expect(() => auth.assertApiKeyAccess(res)).toThrow(/API is not accessible via key/);
        });

        it("Bearer wrong scope → 403; right scope → accessible", () => {
            const res = mockRes({
                authMethod: "apiKey",
                isAccessibleViaKey: false,
                apiKey: { scopes: ["tournaments:read"] as ApiScope[], revokedAt: null },
            });

            expect(() => auth.requireScopes(res, ["users:read"])).toThrow(ForbiddenException);
            expect(res.locals.isAccessibleViaKey).toBe(false);

            auth.requireScopes(res, ["tournaments:read"]);
            expect(res.locals.isAccessibleViaKey).toBe(true);
            expect(() => auth.assertApiKeyAccess(res)).not.toThrow();
        });

        it("authenticateRequest marks Bearer keys as inaccessible until scopes run", async () => {
            const validate = vi.spyOn(ApiKeyService.prototype, "validate").mockResolvedValue({
                user: createMockUser(),
                apiKey: {
                    scopes: ["users:read"],
                    revokedAt: null,
                } as never,
            });

            // Bind bridge the same way KeysModule.onModuleInit does
            const bridge = new ApiKeyService(User, ApiKey);
            bindApiKeyService(bridge);

            const req = mockReq({
                headers: { authorization: "Bearer test-raw-key" },
                originalUrl: "/api/users/me",
            });
            const res = mockRes();
            const next = vi.fn();

            await authenticateRequest(req, res, next);

            expect(next).toHaveBeenCalledOnce();
            expect(res.locals.authMethod).toBe("apiKey");
            expect(res.locals.isAccessibleViaKey).toBe(false);
            validate.mockRestore();
        });
    });

    describe("6. API key path skips CSRF", () => {
        it("conditionalCsrf does not run csurf for apiKey auth", () => {
            const req = mockReq({ session: { mongoId: "x" } as Request["session"] });
            const res = mockRes({ authMethod: "apiKey" });
            const next = vi.fn();

            conditionalCsrf(req, res, next);

            expect(next).toHaveBeenCalledOnce();
            expect(typeof req.csrfToken).not.toBe("function");
        });
    });

    describe("7. Enchant HMAC + rawBody", () => {
        const originalEnchant = { ...config.enchant };

        afterEach(() => {
            config.enchant = originalEnchant;
        });

        it("verifySignature accepts timing-safe HMAC of rawBody", () => {
            config.enchant = { enabled: true, sidebarSecret: "parity-secret" };
            const rawBody = Buffer.from('{"id":"ticket-1"}');
            const signature = crypto.createHmac("sha256", "parity-secret").update(rawBody).digest("hex");

            const sidebar = new EnchantSidebarService(Infringement, Tournament);
            expect(sidebar.verifySignature(rawBody, signature)).toBe(true);
            expect(sidebar.verifySignature(rawBody, "deadbeef")).toBe(false);
            expect(sidebar.verifySignature(undefined, signature)).toBe(false);
        });

        it("EnchantHmacGuard rejects bad signatures when enabled", () => {
            config.enchant = { enabled: true, sidebarSecret: "parity-secret" };
            const guard = new EnchantHmacGuard(
                new EnchantService(new EnchantSidebarService(Infringement, Tournament)),
            );
            const rawBody = Buffer.from('{"id":"ticket-1"}');
            const context = {
                switchToHttp: () => ({
                    getRequest: () =>
                        ({
                            rawBody,
                            headers: { "enchant-signature": "bad" },
                        }) as Request,
                }),
            };

            expect(() => guard.canActivate(context as never)).toThrow(UnauthorizedException);
        });

        it("createExpressApp captures rawBody when enchant-signature header is present", () => {
            const src = fs.readFileSync(path.join(__dirname, "../../createExpressApp.ts"), "utf8");
            expect(src).toContain('req.headers["enchant-signature"]');
            expect(src).toContain("rawBody = buf");
            expect(src).toContain("isEnchantApiPath");
        });
    });

    describe("8. existing browser sessions survive deploy", () => {
        it("keeps session secret, MongoStore, connect.sid defaults, and cookie flags", () => {
            const src = fs.readFileSync(path.join(__dirname, "../../createExpressApp.ts"), "utf8");

            expect(config.session).toBeTruthy();
            expect(src).toContain("secret: config.session");
            expect(src).toContain("MongoStore({ mongooseConnection: mongoose.connection })");
            expect(src).toContain('sameSite: "lax"');
            expect(src).toContain("httpOnly: true");
            // Cookie name is not overridden → express-session default `connect.sid`
            expect(src).not.toMatch(/name:\s*["']/);
        });
    });
});
