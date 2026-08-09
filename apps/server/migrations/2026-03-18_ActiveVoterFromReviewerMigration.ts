import BaseMigration from "./BaseMigration";
import mongoose from "mongoose";

export default class ActiveVoterFromReviewerMigration extends BaseMigration {
    name = "ActiveVoterFromReviewer";
    description = "Backfill isActiveVoter from isActiveReviewer for existing users";

    protected async execute(): Promise<void> {
        const db = mongoose.connection.db!;
        const usersCollection = db.collection("users");

        const missingBefore = await usersCollection.countDocuments({
            isActiveVoter: { $exists: false },
        });

        this.log(`Found ${missingBefore} users missing isActiveVoter`);

        if (missingBefore === 0) {
            this.log("No users to backfill");
            return;
        }

        const setTrueResult = await usersCollection.updateMany(
            {
                isActiveVoter: { $exists: false },
                isActiveReviewer: true,
            },
            { $set: { isActiveVoter: true } },
        );

        const setFalseResult = await usersCollection.updateMany(
            {
                isActiveVoter: { $exists: false },
                isActiveReviewer: false,
            },
            { $set: { isActiveVoter: false } },
        );

        const fallbackResult = await usersCollection.updateMany(
            {
                isActiveVoter: { $exists: false },
            },
            { $set: { isActiveVoter: true } },
        );

        const missingAfter = await usersCollection.countDocuments({
            isActiveVoter: { $exists: false },
        });

        this.log(`Backfilled as true from reviewer=true: ${setTrueResult.modifiedCount}`);
        this.log(`Backfilled as false from reviewer=false: ${setFalseResult.modifiedCount}`);
        this.log(`Backfilled remaining users with default true: ${fallbackResult.modifiedCount}`);
        this.log(`Users still missing isActiveVoter: ${missingAfter}`);
    }
}
