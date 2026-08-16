import BaseMigration from "./BaseMigration";
import mongoose from "mongoose";

export default class SingleTargetUserToMultipleTargetUsersMigration extends BaseMigration {
    name = "SingleTargetUserToMultipleTargetUsers";
    description = "Migrating votings from single targetUser to multiple targetUsers";

    protected async execute(): Promise<void> {
        const votingsCollection = mongoose.connection.db!.collection("votings");

        const targetUserCount = await votingsCollection.countDocuments({ targetUser: { $exists: true } });
        this.log(`Found ${targetUserCount} votings with old targetUser field`);

        const targetResult = await votingsCollection.updateMany({ targetUser: { $exists: true } }, [
            {
                $set: {
                    targetUsers: {
                        $cond: [{ $ifNull: ["$targetUser", false] }, ["$targetUser"], []],
                    },
                },
            },
            { $unset: "targetUser" },
        ]);

        const sanctionCount = await votingsCollection.countDocuments({
            sanctionInfringementId: { $exists: true },
        });
        this.log(`Found ${sanctionCount} votings with old sanctionInfringementId field`);

        const sanctionResult = await votingsCollection.updateMany({ sanctionInfringementId: { $exists: true } }, [
            {
                $set: {
                    sanctionInfringementIds: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ["$sanctionInfringementIds", []] } }, 0] },
                            "$sanctionInfringementIds",
                            ["$sanctionInfringementId"],
                        ],
                    },
                },
            },
            { $unset: "sanctionInfringementId" },
        ]);

        this.log(`\n✓ Migration completed successfully!`);
        this.log(`  - targetUser → targetUsers: ${targetResult.modifiedCount}`);
        this.log(`  - sanctionInfringementId → sanctionInfringementIds: ${sanctionResult.modifiedCount}`);

        const verificationCount = await votingsCollection.countDocuments({
            targetUsers: { $exists: true, $ne: [] },
        });
        const oldFormatCount = await votingsCollection.countDocuments({ targetUser: { $exists: true } });
        const oldSanctionCount = await votingsCollection.countDocuments({
            sanctionInfringementId: { $exists: true },
        });

        this.log(`\n📊 Verification:`);
        this.log(`  - Votings with targetUsers array: ${verificationCount}`);
        this.log(`  - Votings with old targetUser field: ${oldFormatCount}`);
        this.log(`  - Votings with old sanctionInfringementId field: ${oldSanctionCount}`);
    }
}
