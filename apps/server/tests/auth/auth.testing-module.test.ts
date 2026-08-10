import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { ApiScope } from "@tc/types/ApiKey";
import User from "@tc/models/userModel";
import { AuthService } from "../../modules/auth/auth.service";
import { USER_MODEL } from "../../modules/common/database.tokens";
import { IsLoggedInGuard, RequireScopesGuard } from "../../modules/guards/auth.guards";
import { TournamentsController } from "../../modules/tournaments/tournaments.controller";
import { TournamentsService } from "../../modules/tournaments/tournaments.service";
import { TicketsController } from "../../modules/tickets/tickets.controller";
import { TicketsService } from "../../modules/tickets/tickets.service";
import { createMockUser } from "../utils/users";

function httpContext(req: Partial<Request>, resLocals: Record<string, unknown> = {}): ExecutionContext {
    const res = { locals: resLocals } as unknown as Response;
    return {
        switchToHttp: () => ({
            getRequest: () => req as Request,
            getResponse: () => res,
        }),
    } as ExecutionContext;
}

describe("Nest TestingModule auth + controller smoke", () => {
    let auth: AuthService;
    let isLoggedIn: IsLoggedInGuard;
    let requireUsersRead: InstanceType<ReturnType<typeof RequireScopesGuard>>;

    beforeAll(async () => {
        const UsersReadGuard = RequireScopesGuard(["users:read"]);
        const moduleRef = await Test.createTestingModule({
            providers: [
                AuthService,
                IsLoggedInGuard,
                UsersReadGuard,
                { provide: USER_MODEL, useValue: User },
            ],
        }).compile();

        auth = moduleRef.get(AuthService);
        isLoggedIn = moduleRef.get(IsLoggedInGuard);
        requireUsersRead = moduleRef.get(UsersReadGuard);
    });

    it("resolves AuthService and IsLoggedInGuard from TestingModule", () => {
        expect(auth).toBeInstanceOf(AuthService);
        expect(isLoggedIn).toBeInstanceOf(IsLoggedInGuard);
    });

    it("RequireScopesGuard mixin grants matching Bearer scopes via DI", () => {
        const context = httpContext({}, {
            authMethod: "apiKey",
            isAccessibleViaKey: false,
            apiKey: { scopes: ["users:read"] as ApiScope[], revokedAt: null },
        });

        expect(requireUsersRead.canActivate(context)).toBe(true);
        expect(context.switchToHttp().getResponse<Response>().locals.isAccessibleViaKey).toBe(true);
    });

    it("RequireScopesGuard mixin denies missing Bearer scopes via DI", () => {
        const context = httpContext({}, {
            authMethod: "apiKey",
            isAccessibleViaKey: false,
            apiKey: { scopes: ["tournaments:read"] as ApiScope[], revokedAt: null },
        });

        expect(() => requireUsersRead.canActivate(context)).toThrow(ForbiddenException);
    });

    it("IsLoggedInGuard loads the session user through AuthService", async () => {
        const user = createMockUser();
        const ensureLoggedIn = vi.spyOn(auth, "ensureLoggedIn").mockResolvedValue(user);

        const context = httpContext({
            session: { mongoId: user.id } as Request["session"],
        });

        await expect(isLoggedIn.canActivate(context)).resolves.toBe(true);
        expect(ensureLoggedIn).toHaveBeenCalledOnce();
        ensureLoggedIn.mockRestore();
    });

    it("constructs TournamentsController with a mocked TournamentsService", async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [TournamentsController],
            providers: [
                AuthService,
                IsLoggedInGuard,
                { provide: USER_MODEL, useValue: User },
                { provide: TournamentsService, useValue: { index: vi.fn() } },
            ],
        }).compile();

        const controller = moduleRef.get(TournamentsController);
        expect(controller).toBeInstanceOf(TournamentsController);
    });

    it("constructs TicketsController with a mocked TicketsService", async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [TicketsController],
            providers: [
                AuthService,
                IsLoggedInGuard,
                { provide: USER_MODEL, useValue: User },
                { provide: TicketsService, useValue: { index: vi.fn() } },
            ],
        }).compile();

        const controller = moduleRef.get(TicketsController);
        expect(controller).toBeInstanceOf(TicketsController);
    });
});
