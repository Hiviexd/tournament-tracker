import BaseMigration from "./BaseMigration";
import mongoose from "mongoose";

export default class InfringementReworkMigration extends BaseMigration {
    name = "InfringementRework";
    description =
        "Extracting embedded infringements from users into standalone Infringement collection, converting PROBATION to WARNING";

    protected async execute(): Promise<void> {
        const db = mongoose.connection.db!;
        const usersCollection = db.collection("users");
        const infringementsCollection = db.collection("infringements");

        const usersWithInfringements = await usersCollection
            .find({ infringements: { $exists: true, $ne: [] } })
            .toArray();

        this.log(`Found ${usersWithInfringements.length} users with embedded infringements`);

        let migratedCount = 0;
        let probationConvertedCount = 0;
        let errorCount = 0;

        for (const user of usersWithInfringements) {
            try {
                const infringements = user.infringements || [];

                for (const inf of infringements) {
                    let type = inf.type;
                    let reason = inf.reason;

                    if (type === "probation") {
                        type = "warning";
                        reason = (reason || "") + "\n\n*Migrated Hosting Probation*";
                        probationConvertedCount++;
                    }

                    await infringementsCollection.insertOne({
                        _id: inf._id,
                        userId: user._id,
                        type,
                        startDate: inf.startDate || undefined,
                        endDate: inf.endDate || undefined,
                        reason,
                        threadId: inf.threadId || undefined,
                        enchantUrl: inf.enchantUrl || undefined,
                        createdAt: inf.createdAt || new Date(),
                        updatedAt: inf.updatedAt || new Date(),
                    });

                    migratedCount++;
                }

                this.log(`✓ Migrated ${infringements.length} infringements for user: ${user.username}`);
            } catch (error) {
                this.log(`✗ Failed to migrate infringements for user ${user.username}: ${error}`);
                errorCount++;
            }
        }

        this.log(
            `\nPhase 1 complete: Migrated ${migratedCount} infringements (${probationConvertedCount} probations converted to warnings)`,
        );

        // Unset embedded infringements from all users
        const unsetResult = await usersCollection.updateMany(
            { infringements: { $exists: true } },
            { $unset: { infringements: 1 } },
        );

        this.log(`Phase 2 complete: Removed embedded infringements from ${unsetResult.modifiedCount} users`);

        // Create index on userId
        await infringementsCollection.createIndex({ userId: 1 });
        this.log("Created index on userId");

        // Verification
        const totalInfringements = await infringementsCollection.countDocuments();
        const usersStillWithEmbedded = await usersCollection.countDocuments({
            infringements: { $exists: true },
        });

        this.log(`\nVerification:`);
        this.log(`  - Total infringements in new collection: ${totalInfringements}`);
        this.log(`  - Users still with embedded infringements field: ${usersStillWithEmbedded}`);
        this.log(`  - Probations converted to warnings: ${probationConvertedCount}`);
        this.log(`  - Errors: ${errorCount}`);
    }
}
