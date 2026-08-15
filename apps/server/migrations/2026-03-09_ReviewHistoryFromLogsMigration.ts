import BaseMigration from "./BaseMigration";
import Tournament from "../models/tournamentModel";
import User from "../models/userModel";
import { Types } from "mongoose";

/** Regex to extract osu.ppy.sh user IDs from log action text (e.g. [**name**](https://osu.ppy.sh/users/12345)) */
const OSU_USER_ID_REGEX = /osu\.ppy\.sh\/users\/(\d+)/g;

function extractOsuIdsFromAction(action: string): number[] {
    const ids: number[] = [];
    let m: RegExpExecArray | null;
    OSU_USER_ID_REGEX.lastIndex = 0;
    while ((m = OSU_USER_ID_REGEX.exec(action)) !== null) {
        ids.push(parseInt(m[1], 10));
    }
    return ids;
}

export default class ReviewHistoryFromLogsMigration extends BaseMigration {
    name = "ReviewHistoryFromLogs";
    description =
        "Backfill tournament reviewHistory from existing tournament logs (parse reviewer links, resolve by osuId)";

    protected async execute(): Promise<void> {
        const tournaments = await Tournament.find({
            "logs.0": { $exists: true },
            $or: [{ reviewHistory: { $exists: false } }, { reviewHistory: { $size: 0 } }],
        }).lean();

        this.log(`Found ${tournaments.length} tournaments with logs and no reviewHistory`);

        let migratedCount = 0;
        let errorCount = 0;
        let skippedLogs = 0;

        for (const tournament of tournaments) {
            try {
                const logs = tournament.logs || [];
                const reviewHistory: {
                    user: Types.ObjectId;
                    action: "assign" | "remove" | "initial";
                    createdAt: Date;
                    updatedAt: Date;
                }[] = [];

                for (const log of logs) {
                    const icon = log.icon || "";
                    const action = log.action || "";
                    const logCreatedAt = log.createdAt ? new Date(log.createdAt) : new Date();

                    if (icon === "users" && action.startsWith("Assigned reviewers:")) {
                        const osuIds = extractOsuIdsFromAction(action);
                        for (const osuId of osuIds) {
                            const user = await User.findOne({ osuId }).select("_id").lean();
                            if (user) {
                                reviewHistory.push({
                                    user: user._id,
                                    action: "initial",
                                    createdAt: logCreatedAt,
                                    updatedAt: logCreatedAt,
                                });
                            } else {
                                skippedLogs++;
                            }
                        }
                    } else if (icon === "users" && action.startsWith("Added reviewer:")) {
                        const osuIds = extractOsuIdsFromAction(action);
                        const osuId = osuIds[0];
                        if (osuId !== undefined) {
                            const user = await User.findOne({ osuId }).select("_id").lean();
                            if (user) {
                                reviewHistory.push({
                                    user: user._id,
                                    action: "assign",
                                    createdAt: logCreatedAt,
                                    updatedAt: logCreatedAt,
                                });
                            } else {
                                skippedLogs++;
                            }
                        }
                    } else if (icon === "user-minus" && action.startsWith("Removed reviewer:")) {
                        const osuIds = extractOsuIdsFromAction(action);
                        const osuId = osuIds[0];
                        if (osuId !== undefined) {
                            const user = await User.findOne({ osuId }).select("_id").lean();
                            if (user) {
                                reviewHistory.push({
                                    user: user._id,
                                    action: "remove",
                                    createdAt: logCreatedAt,
                                    updatedAt: logCreatedAt,
                                });
                            } else {
                                skippedLogs++;
                            }
                        }
                    } else if (icon === "user-pen" && action.startsWith("Reassigned reviewer")) {
                        const osuIds = extractOsuIdsFromAction(action);
                        const oldOsuId = osuIds[0];
                        const newOsuId = osuIds[1];
                        if (oldOsuId !== undefined) {
                            const oldUser = await User.findOne({ osuId: oldOsuId }).select("_id").lean();
                            if (oldUser) {
                                reviewHistory.push({
                                    user: oldUser._id,
                                    action: "remove",
                                    createdAt: logCreatedAt,
                                    updatedAt: logCreatedAt,
                                });
                            } else {
                                skippedLogs++;
                            }
                        }
                        if (newOsuId !== undefined) {
                            const newUser = await User.findOne({ osuId: newOsuId }).select("_id").lean();
                            if (newUser) {
                                reviewHistory.push({
                                    user: newUser._id,
                                    action: "assign",
                                    createdAt: logCreatedAt,
                                    updatedAt: logCreatedAt,
                                });
                            } else {
                                skippedLogs++;
                            }
                        }
                    }
                }

                if (reviewHistory.length > 0) {
                    await Tournament.updateOne({ _id: tournament._id }, { $set: { reviewHistory } });
                    migratedCount++;
                    this.log(`✓ Migrated ${tournament.name}: ${reviewHistory.length} review history entries`);
                }
            } catch (error) {
                this.log(`✗ Failed to migrate tournament ${tournament.name}: ${error}`);
                errorCount++;
            }
        }

        this.log(`\n✓ Migration completed`);
        this.log(`  - Tournaments updated: ${migratedCount}`);
        this.log(`  - Log entries skipped (user not found): ${skippedLogs}`);
        this.log(`  - Errors: ${errorCount}`);
    }
}
