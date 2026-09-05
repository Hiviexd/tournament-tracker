import BaseMigration from "./BaseMigration";
import mongoose from "mongoose";
import { buildOsuAnnouncementChatUrl, isNumber } from "@tc/utils";

export default class SanctionAnnouncementEnchantUrlMigration extends BaseMigration {
    name = "SanctionAnnouncementEnchantUrl";
    description = "Backfill enchantUrl on sanction infringements from stored announcement channel IDs";

    protected async execute(): Promise<void> {
        const db = mongoose.connection.db!;
        const votingsCollection = db.collection("votings");
        const infringementsCollection = db.collection("infringements");

        const votings = await votingsCollection
            .find({
                sanctionAnnouncementChannelId: { $exists: true, $type: "number" },
                sanctionInfringementIds: { $exists: true, $ne: [] },
            })
            .project({ sanctionAnnouncementChannelId: 1, sanctionInfringementIds: 1 })
            .toArray();

        this.log(`Found ${votings.length} sanction votes with an announcement channel`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const voting of votings) {
            const channelId = voting.sanctionAnnouncementChannelId;
            const infringementIds = voting.sanctionInfringementIds ?? [];
            if (!isNumber(channelId) || !infringementIds.length) {
                skippedCount++;
                continue;
            }

            const enchantUrl = buildOsuAnnouncementChatUrl(channelId);
            const result = await infringementsCollection.updateMany(
                {
                    _id: { $in: infringementIds },
                    $or: [{ enchantUrl: { $exists: false } }, { enchantUrl: null }, { enchantUrl: "" }],
                },
                { $set: { enchantUrl } },
            );

            updatedCount += result.modifiedCount;
        }

        this.log(`Backfilled enchantUrl on ${updatedCount} infringements`);
        if (skippedCount) {
            this.log(`Skipped ${skippedCount} votings with incomplete announcement data`);
        }
    }
}
