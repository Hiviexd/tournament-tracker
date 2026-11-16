import mongoose, { Schema } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ISoftDeletable } from "@tc/types/SoftDelete";
import {
    WITH_DELETED,
    canViewDeleted,
    deletedVisibility,
    restoreDeleted,
    softDelete,
    softDeletePlugin,
} from "../../plugins/softDeletePlugin";

interface IThing extends ISoftDeletable {
    name: string;
    ownerId?: mongoose.Types.ObjectId;
    tag?: string;
}

const ActorId = new mongoose.Types.ObjectId();

const ThingSchema = new Schema<IThing>({
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "SoftDeleteOwner" },
    tag: { type: String, unique: true, sparse: true },
});
ThingSchema.plugin(softDeletePlugin);
const Thing = mongoose.model("SoftDeleteThing", ThingSchema);

const OwnerSchema = new Schema({ name: String }, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
OwnerSchema.virtual("things", { ref: "SoftDeleteThing", localField: "_id", foreignField: "ownerId" });
const Owner = mongoose.model("SoftDeleteOwner", OwnerSchema);

let server: MongoMemoryServer;

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
}, 300000);

afterEach(async () => {
    await Thing.collection.deleteMany({});
    await Owner.collection.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await server.stop();
});

async function seed() {
    const owner = await Owner.create({ name: "owner" });
    const live = await Thing.create({ name: "live", ownerId: owner._id });
    const gone = await Thing.create({ name: "gone", ownerId: owner._id });
    await softDelete(gone, ActorId);
    return { owner, live, gone };
}

describe("default filter", () => {
    it("hides soft-deleted documents from find, findOne, findById and exists", async () => {
        const { gone } = await seed();

        expect((await Thing.find()).map((thing) => thing.name)).toEqual(["live"]);
        expect(await Thing.findOne({ name: "gone" })).toBeNull();
        expect(await Thing.findById(gone._id)).toBeNull();
        expect(await Thing.exists({ _id: gone._id })).toBeNull();
    });

    it("hides them from countDocuments and distinct", async () => {
        await seed();

        expect(await Thing.countDocuments()).toBe(1);
        expect(await Thing.distinct("name")).toEqual(["live"]);
    });

    it("hides them from aggregates, including facets", async () => {
        await seed();

        const [result] = await Thing.aggregate([{ $facet: { total: [{ $count: "count" }] } }]);

        expect(result.total[0].count).toBe(1);
    });

    it("hides them from virtual populates", async () => {
        const { owner } = await seed();

        const populated = await Owner.findById(owner._id).populate("things").orFail();

        expect(populated.get("things").map((thing: { name: string }) => thing.name)).toEqual(["live"]);
    });

    it("hides them from populates called after an aggregate", async () => {
        const { owner } = await seed();

        const [plain] = await Owner.aggregate([{ $match: { _id: owner._id } }]);
        const [populated] = await Owner.populate([plain], { path: "things" });

        expect(populated.things.map((thing: { name: string }) => thing.name)).toEqual(["live"]);
    });

    it("does not let updates touch them", async () => {
        const { gone } = await seed();

        await Thing.updateOne({ _id: gone._id }, { name: "changed" });
        await Thing.updateMany({}, { name: "changed" });
        await Thing.findOneAndUpdate({ _id: gone._id }, { name: "changed" });

        const raw = await Thing.findById(gone._id).setOptions(WITH_DELETED).orFail();
        expect(raw.name).toBe("gone");
    });

    it("treats documents without a deletedAt field as live", async () => {
        await Thing.collection.insertOne({ name: "legacy" });

        expect(await Thing.countDocuments()).toBe(1);
    });

    it("combines with an existing $or filter", async () => {
        await seed();

        const found = await Thing.find({ $or: [{ name: "live" }, { name: "gone" }] });

        expect(found.map((thing) => thing.name)).toEqual(["live"]);
    });
});

describe("WITH_DELETED", () => {
    it("includes soft-deleted documents in queries", async () => {
        const { gone } = await seed();

        expect(await Thing.find().setOptions(WITH_DELETED)).toHaveLength(2);
        expect(await Thing.countDocuments().setOptions(WITH_DELETED)).toBe(2);
        expect(await Thing.findById(gone._id).setOptions(WITH_DELETED)).not.toBeNull();
        expect(await Thing.exists({ _id: gone._id }).setOptions(WITH_DELETED)).not.toBeNull();
    });

    it("includes soft-deleted documents in aggregates", async () => {
        await seed();

        const all = await Thing.aggregate([{ $sort: { name: 1 } }]).option(WITH_DELETED);

        expect(all.map((thing) => thing.name)).toEqual(["gone", "live"]);
    });

    it("can select only soft-deleted documents", async () => {
        await seed();

        const deleted = await Thing.find({ deletedAt: { $ne: null } }).setOptions(WITH_DELETED);

        expect(deleted.map((thing) => thing.name)).toEqual(["gone"]);
    });

    it("keeps the filter on when the option is false", async () => {
        await seed();

        expect(await Thing.find().setOptions({ withDeleted: false })).toHaveLength(1);
        expect(await Thing.aggregate([]).option({ withDeleted: false })).toHaveLength(1);
    });
});

describe("softDelete and restoreDeleted", () => {
    it("records who deleted the document, and restore clears it", async () => {
        const { gone } = await seed();

        const deleted = await Thing.findById(gone._id).setOptions(WITH_DELETED).orFail();
        expect(deleted.deletedAt).toBeInstanceOf(Date);
        expect(deleted.deletedBy?.toString()).toBe(ActorId.toString());

        await restoreDeleted(deleted);

        const raw = await Thing.collection.findOne({ _id: gone._id });
        expect(raw).not.toHaveProperty("deletedAt");
        expect(raw).not.toHaveProperty("deletedBy");
        expect(await Thing.findById(gone._id)).not.toBeNull();
    });

    it("works on documents that no longer pass validation", async () => {
        const { insertedId } = await Thing.collection.insertOne({ ownerId: new mongoose.Types.ObjectId() });
        const invalid = await Thing.findById(insertedId).orFail();

        await softDelete(invalid, ActorId);

        expect(await Thing.findById(insertedId)).toBeNull();
    });

    it("keeps unique values reserved while soft-deleted", async () => {
        const thing = await Thing.create({ name: "first", tag: "taken" });
        await Thing.init();
        await softDelete(thing, ActorId);

        await expect(Thing.create({ name: "second", tag: "taken" })).rejects.toThrow(/E11000/);
    });
});

describe("canViewDeleted", () => {
    it("allows admins and devs only", () => {
        expect(canViewDeleted({ isAdmin: true, isDev: false })).toBe(true);
        expect(canViewDeleted({ isAdmin: false, isDev: true })).toBe(true);
        expect(canViewDeleted({ isAdmin: false, isDev: false })).toBe(false);
        expect(canViewDeleted(undefined)).toBe(false);
    });

    it("drives the query option", () => {
        expect(deletedVisibility({ isAdmin: true, isDev: false })).toEqual({ withDeleted: true });
        expect(deletedVisibility(undefined)).toEqual({ withDeleted: false });
    });
});
