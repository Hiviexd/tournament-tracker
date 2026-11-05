import { vi } from "vitest";
import type { Model } from "mongoose";

/**
 * Stubs only the driver-level reads of a model, so real Mongoose behaviour (populate, strict
 * populate, virtuals, hydration) still runs without a database.
 */
export function stubCollectionReads<T>(model: Model<T>, docs: object[]) {
    vi.spyOn(model.collection, "find").mockImplementation(
        // SAFETY: Mongoose only consumes the returned cursor through toArray here.
        () => ({ toArray: () => Promise.resolve(docs) }) as never,
    );
    vi.spyOn(model.collection, "findOne").mockImplementation(
        // SAFETY: the driver resolves findOne with a raw document, which is what docs holds.
        (() => Promise.resolve(docs[0] ?? null)) as never,
    );
}
