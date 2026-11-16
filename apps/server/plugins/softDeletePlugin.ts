import { Aggregate, Query, Schema, Types } from "mongoose";
import { ISoftDeletable } from "@tc/types/SoftDelete";
import { IUser } from "@tc/types/User";

/** Query/aggregate option that turns the soft-delete filter off for one read. */
export const WITH_DELETED = { withDeleted: true };

const FILTERED_QUERIES = [
    "find",
    "findOne",
    "countDocuments",
    "distinct",
    "findOneAndUpdate",
    "updateOne",
    "updateMany",
] as const;

/**
 * Hides soft-deleted documents from every query and aggregate on the schema unless `WITH_DELETED` is set.
 * `deletedAt: null` also matches documents written before the field existed, so no backfill is needed.
 */
export function softDeletePlugin(schema: Schema<any, any, any, any>) {
    schema.add({
        deletedAt: { type: Date },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    });

    for (const operation of FILTERED_QUERIES) {
        schema.pre(operation, function (this: Query<unknown, unknown>) {
            if (!this.getOptions().withDeleted) {
                this.where({ deletedAt: null });
            }
        });
    }

    schema.pre("aggregate", function (this: Aggregate<unknown>) {
        // Custom option: Mongoose would otherwise forward it to the driver.
        const withDeleted = this.options.withDeleted;
        delete this.options.withDeleted;

        if (!withDeleted) {
            this.pipeline().unshift({ $match: { deletedAt: null } });
        }
    });
}

/** Admins and devs, matching the `auth.isAdmin` middleware. */
export function canViewDeleted(user: Pick<IUser, "isAdmin" | "isDev"> | undefined) {
    return !!(user?.isAdmin || user?.isDev);
}

/** Query options for read routes that show soft-deleted documents to admins only. */
export function deletedVisibility(user: Pick<IUser, "isAdmin" | "isDev"> | undefined) {
    return { withDeleted: canViewDeleted(user) };
}

type SoftDeletableDocument = ISoftDeletable & {
    save(options?: { validateBeforeSave?: boolean }): Promise<object>;
};

// Validation is skipped so that documents predating a stricter schema can still be deleted and restored.
export async function softDelete(doc: SoftDeletableDocument, deletedBy: Types.ObjectId | string) {
    doc.deletedAt = new Date();
    doc.deletedBy = deletedBy;
    await doc.save({ validateBeforeSave: false });
}

export async function restoreDeleted(doc: SoftDeletableDocument) {
    doc.deletedAt = undefined;
    doc.deletedBy = undefined;
    await doc.save({ validateBeforeSave: false });
}
