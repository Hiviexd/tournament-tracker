import express, { ErrorRequestHandler } from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import articleRouter from "../../routers/articlesRouter";
import infringementsRouter from "../../routers/infringementsRouter";
import resourcesRouter from "../../routers/resourcesRouter";
import templatesRouter from "../../routers/templatesRouter";
import tournamentsRouter from "../../routers/tournamentsRouter";
import votingsRouter from "../../routers/votingsRouter";
import Article from "../../models/articleModel";
import Infringement from "../../models/infringementModel";
import Resource from "../../models/resourceModel";
import Template from "../../models/templateModel";
import Tournament from "../../models/tournamentModel";
import User from "../../models/userModel";
import Voting from "../../models/votingModel";
import "../../models/attachmentModel";
import "../../models/messageModel";
import "../../models/reviewModel";
import "../../models/voteModel";
import { WITH_DELETED } from "../../plugins/softDeletePlugin";

vi.mock("@tc/config", () => ({ default: { baseUrl: "https://example.test" } }));
vi.mock("../../services/UploadService", () => ({ default: {} }));
vi.mock("../../services/discord/WebhookBuilder", () => ({
    WebhookBuilder: class {
        addEmbed() {
            return this;
        }
        setThreadId() {
            return this;
        }
        async send() {}
    },
}));

const FAR_FUTURE = Date.now() + 365 * 24 * 60 * 60 * 1000;

let mongo: MongoMemoryServer;
let server: Server;
let baseUrl: string;
let sessionUserId: string | undefined;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    const app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        Object.assign(req, { session: { mongoId: sessionUserId, expireDate: FAR_FUTURE } });
        res.locals.authMethod = "session";
        next();
    });
    app.use("/api/tournaments", tournamentsRouter);
    app.use("/api/votes", votingsRouter);
    app.use("/api/articles", articleRouter);
    app.use("/api/resources", resourcesRouter);
    app.use("/api/templates", templatesRouter);
    app.use("/api/infringements", infringementsRouter);

    const notFoundHandler: ErrorRequestHandler = (err, _req, res, _next) => {
        res.status(err.name === "DocumentNotFoundError" ? 404 : 500).json({ error: err.message });
    };
    app.use(notFoundHandler);

    server = await new Promise((resolve) => {
        const listening = app.listen(0, () => resolve(listening));
    });
    // SAFETY: a server listening on a TCP port always reports an AddressInfo.
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
}, 300000);

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
});

afterEach(async () => {
    await mongoose.connection.db!.dropDatabase();
    sessionUserId = undefined;
});

async function loginAs(groups: string[]) {
    const { insertedId } = await User.collection.insertOne({
        osuId: Math.floor(Math.random() * 1e9),
        username: groups.join("-"),
        groups,
    });
    sessionUserId = insertedId.toString();
}

// `auth` redirects instead of answering 401 unless the request asks for JSON
const headers = { Accept: "application/json" };
const get = (path: string) => fetch(`${baseUrl}${path}`, { headers });
const post = (path: string) => fetch(`${baseUrl}${path}`, { method: "POST", headers });
const del = (path: string) => fetch(`${baseUrl}${path}`, { method: "DELETE", headers });

async function insertTournament(name = "Example Cup") {
    const { insertedId } = await Tournament.collection.insertOne({
        name,
        status: "supportRequestReceived",
        type: "tournament",
        isActive: true,
        hosts: [],
        modes: [],
        reviews: [],
        notes: [],
        logs: [],
        assignedReviewers: [],
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
    });
    return insertedId.toString();
}

async function insertVoting() {
    const { insertedId } = await Voting.collection.insertOne({
        title: "Example vote",
        isActive: true,
        isPublic: false,
        votes: [],
        options: ["yes", "no"],
        type: "binary",
        category: "discussion",
        assignedGroups: ["tc"],
        createdAt: new Date(),
    });
    return insertedId.toString();
}

describe("tournaments", () => {
    let tournamentId: string;

    beforeEach(async () => {
        tournamentId = await insertTournament();
        await loginAs(["admin"]);
        expect((await del(`/api/tournaments/${tournamentId}/delete`)).status).toBe(200);
    });

    it("soft-deletes instead of removing the document", async () => {
        const raw = await Tournament.collection.findOne({ _id: new Types.ObjectId(tournamentId) });

        expect(raw?.deletedAt).toBeInstanceOf(Date);
        expect(raw?.deletedBy?.toString()).toBe(sessionUserId);
    });

    it("shows it to admins in the listing and detail page", async () => {
        const list = await (await get("/api/tournaments")).json();
        const detail = await (await get(`/api/tournaments/${tournamentId}`)).json();

        expect(list.total).toBe(1);
        expect(list.tournaments[0].deletedAt).toBeTruthy();
        expect(detail.tournament.deletedAt).toBeTruthy();
    });

    it("keeps it out of the personal review queue", async () => {
        const list = await (await get("/api/tournaments?showAllAssignedReviews=true")).json();

        expect(list.total).toBe(0);
    });

    it.each([
        ["committee", ["tc"]],
        ["regular users", ["user"]],
    ])("hides it from %s", async (_label, groups) => {
        await loginAs(groups);

        const list = await (await get("/api/tournaments")).json();

        expect(list.total).toBe(0);
        expect(list.tournaments).toEqual([]);
        expect((await get(`/api/tournaments/${tournamentId}`)).status).toBe(404);
    });

    it("hides it from logged-out visitors", async () => {
        sessionUserId = undefined;

        expect((await get(`/api/tournaments/${tournamentId}`)).status).toBe(404);
    });

    it("rejects mutations while deleted, even from admins", async () => {
        const response = await fetch(`${baseUrl}/api/tournaments/${tournamentId}/updateThreadId`, {
            method: "PATCH",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ threadId: "1" }),
        });

        expect(response.status).toBe(404);
    });

    it("cannot be deleted twice", async () => {
        expect((await del(`/api/tournaments/${tournamentId}/delete`)).status).toBe(404);
    });

    it("can be restored by admins only", async () => {
        await loginAs(["tc"]);
        expect((await post(`/api/tournaments/${tournamentId}/restore`)).status).toBe(401);

        await loginAs(["admin"]);
        expect((await post(`/api/tournaments/${tournamentId}/restore`)).status).toBe(200);

        await loginAs(["user"]);
        expect((await get(`/api/tournaments/${tournamentId}`)).status).toBe(200);
    });

    it("refuses to restore a tournament that is not deleted", async () => {
        const liveId = await insertTournament("Live Cup");

        expect((await post(`/api/tournaments/${liveId}/restore`)).status).toBe(400);
    });
});

describe("votings", () => {
    let votingId: string;

    beforeEach(async () => {
        votingId = await insertVoting();
        await loginAs(["tc"]);
        expect((await del(`/api/votes/${votingId}/delete`)).status).toBe(200);
    });

    it("hides a committee-deleted vote from the committee but not from admins", async () => {
        expect((await get(`/api/votes/${votingId}`)).status).toBe(404);
        expect((await (await get("/api/votes")).json()).total).toBe(0);

        await loginAs(["admin"]);

        expect((await get(`/api/votes/${votingId}`)).status).toBe(200);
        expect((await (await get("/api/votes")).json()).total).toBe(1);
    });

    it("keeps it out of the needs-attention list and restores it", async () => {
        await loginAs(["admin", "tc"]);
        const attention = await (await get("/api/votes?showNeedsAttention=true")).json();
        expect(attention.total).toBe(0);

        expect((await post(`/api/votes/${votingId}/restore`)).status).toBe(200);
        expect(await Voting.findById(votingId)).not.toBeNull();
    });
});

describe("articles", () => {
    const slug = "example-doc";

    beforeEach(async () => {
        await Article.collection.insertOne({
            title: "Example doc",
            content: "body",
            slug,
            type: "documentation",
            isPublic: true,
        });
        await loginAs(["admin"]);
        expect((await del(`/api/articles/${slug}/delete`)).status).toBe(200);
    });

    it("is visible to admins, hidden from committee, and restorable", async () => {
        expect((await (await get(`/api/articles/${slug}`)).json()).deletedAt).toBeTruthy();
        expect(await (await get("/api/articles/documentation")).json()).toHaveLength(1);

        await loginAs(["tc"]);
        expect((await get(`/api/articles/${slug}`)).status).toBe(404);
        expect(await (await get("/api/articles/documentation")).json()).toEqual([]);

        await loginAs(["admin"]);
        expect((await post(`/api/articles/${slug}/restore`)).status).toBe(200);
    });

    it("gives a new article a different slug while the old one is soft-deleted", async () => {
        const article = await new Article({
            title: "Example doc",
            content: "body text here",
            type: "documentation",
        }).save();

        expect(article.slug).toBe("example-doc-1");
    });
});

describe("resources", () => {
    let resourceId: string;

    beforeEach(async () => {
        const { insertedId } = await Resource.collection.insertOne({
            title: "Example resource",
            description: "text",
            category: "tool",
            type: "official",
            link: "https://example.test",
        });
        resourceId = insertedId.toString();
        await loginAs(["tc"]);
        expect((await del(`/api/resources/${resourceId}/delete`)).status).toBe(200);
    });

    it("lists it for admins only and restores it", async () => {
        expect((await (await get("/api/resources")).json()).resources).toEqual([]);
        expect((await post(`/api/resources/${resourceId}/restore`)).status).toBe(401);

        await loginAs(["admin"]);
        expect((await (await get("/api/resources")).json()).resources).toHaveLength(1);
        expect((await post(`/api/resources/${resourceId}/restore`)).status).toBe(200);

        sessionUserId = undefined;
        expect((await (await get("/api/resources")).json()).resources).toHaveLength(1);
    });
});

describe("templates", () => {
    it("lists it for admins only and restores it", async () => {
        const { insertedId } = await Template.collection.insertOne({
            name: "Example",
            content: "Example content",
            category: "General",
        });
        const templateId = insertedId.toString();

        await loginAs(["tc"]);
        expect((await del(`/api/templates/${templateId}/delete`)).status).toBe(200);
        expect(await (await get("/api/templates")).json()).toEqual([]);
        expect((await post(`/api/templates/${templateId}/restore`)).status).toBe(401);

        await loginAs(["admin"]);
        expect(await (await get("/api/templates")).json()).toHaveLength(1);
        expect((await post(`/api/templates/${templateId}/restore`)).status).toBe(200);
    });
});

describe("infringements", () => {
    let targetId: Types.ObjectId;
    let infringementId: string;

    beforeEach(async () => {
        const target = await User.collection.insertOne({ osuId: 1, username: "target", groups: ["user"] });
        targetId = target.insertedId;
        const { insertedId } = await Infringement.collection.insertOne({
            userId: targetId,
            type: "hosting_ban",
            reason: "reason",
            startDate: new Date(),
            createdAt: new Date(),
        });
        infringementId = insertedId.toString();
        await loginAs(["admin"]);
    });

    it("stops counting as active but stays readable for admins", async () => {
        const response = await del(`/api/infringements/${infringementId}/delete`);
        expect(response.status).toBe(200);
        expect((await response.json()).user.infringements).toEqual([]);

        expect(await Infringement.findActiveForUser(targetId)).toBeNull();

        const deleted = await (await get(`/api/infringements/user/${targetId}/deleted`)).json();
        expect(deleted.infringements.map((entry: { id: string }) => entry.id)).toEqual([infringementId]);

        const stored = await Infringement.findById(infringementId).setOptions(WITH_DELETED);
        expect(stored?.deletedBy?.toString()).toBe(sessionUserId);
    });

    it("does not let committee read deleted entries", async () => {
        await loginAs(["tc"]);

        expect((await get(`/api/infringements/user/${targetId}/deleted`)).status).toBe(401);
    });

    it("has no restore route", async () => {
        await del(`/api/infringements/${infringementId}/delete`);

        expect((await post(`/api/infringements/${infringementId}/restore`)).status).toBe(404);
    });
});
