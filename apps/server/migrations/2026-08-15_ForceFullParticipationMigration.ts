import BaseMigration from "./BaseMigration";
import mongoose from "mongoose";

export default class ForceFullParticipationMigration extends BaseMigration {
    name = "ForceFullParticipation";
    description = "Backfill forceFullParticipation to false on votings missing the field";

    protected async execute(): Promise<void> {
        const db = mongoose.connection.db!;
        const votingsCollection = db.collection("votings");

        const missingBefore = await votingsCollection.countDocuments({
            forceFullParticipation: { $exists: false },
        });

        this.log(`Found ${missingBefore} votings missing forceFullParticipation`);

        if (missingBefore === 0) {
            this.log("No votings to backfill");
            return;
        }

        const result = await votingsCollection.updateMany(
            { forceFullParticipation: { $exists: false } },
            { $set: { forceFullParticipation: false } },
        );

        const missingAfter = await votingsCollection.countDocuments({
            forceFullParticipation: { $exists: false },
        });

        this.log(`Backfilled forceFullParticipation=false: ${result.modifiedCount}`);
        this.log(`Votings still missing forceFullParticipation: ${missingAfter}`);
    }
}
