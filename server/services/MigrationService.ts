// base imports
import fs from "fs";
import path from "path";
import csv from "csv-parse";

// voting migration imports
import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import User from "../models/userModel";
import utils from "../../utils";

// tournament migration imports
import Attachment from "../models/attachmentModel";
import Tournament from "../models/tournamentModel";
import Review from "../models/reviewModel";
import Message from "../models/messageModel";
import mongoose from "mongoose";
import UserService from "../services/UserService";
import OsuBotService from "../services/OsuBotService";
import { IReviewChecklistItem } from "../../interfaces/Review";

const FALLBACK_HOST_OSU_ID = "37548950";
const FALLBACK_FORUM_URL = "https://osu.ppy.sh/community/forums/topics/1715676";
const FILE_UPLOAD_CATEGORY = "tournaments";

import checklist from "../../checklist.json";

const TC_REVIEW_CHECKLIST = checklist.tc;
const CC_REVIEW_CHECKLIST = checklist.cc;

class MigrationService {
    public async migratePif2Votings() {
        if (!process.env.MIGRATION || process.env.MIGRATION !== "true") return;
        console.log(utils.consoleStyles("⚠  Migrating pif2 votings", ["orange", "bold", "underline"]));

        const votings = [] as IPif2Voting[];

        for (const voting of votings) {
            const author = await User.findByUsernameOrOsuId(voting.user.osu_id);
            const requiredVotes = voting.votes.length;
            const isActive = false;
            const category = "discussion";
            const assignedGroups = ["tc"];
            const title = voting.title;
            const description = voting.description;
            const duration = 3;
            const type = "classic";
            const options = voting.voting_options.map((option) => option.option);

            const deadline = new Date(voting.deadline);
            const createdAt = new Date(deadline.getTime() - duration * 24 * 60 * 60 * 1000);

            const newVoting = await new Voting({
                author,
                category,
                assignedGroups,
                title,
                description,
                duration,
                type,
                options,
                requiredVotes,
                createdAt,
                updatedAt: deadline,
                concludedAt: deadline,
                isActive,
            }).save();

            // Create a map of option IDs to their indices
            const optionIdToIndex = new Map(voting.voting_options.map((opt, index) => [opt.id, index]));

            // insert votes
            for (const vote of voting.votes) {
                const user = await User.findByUsernameOrOsuId(vote.user.osu_id);

                // Get the index of the selected option
                const optionIndex = optionIdToIndex.get(vote.voting_option_id);

                if (optionIndex === undefined) {
                    console.error(
                        `Could not find option index for vote option ID ${vote.voting_option_id} in voting ${voting.id}`
                    );
                    continue;
                }

                const newVote = await new Vote({
                    author: user,
                    comment: vote.comment,
                    data: {
                        type,
                        option: optionIndex,
                    },
                }).save();

                // Add vote to voting
                await Voting.findByIdAndUpdate(newVoting._id, {
                    $push: { votes: newVote._id },
                });

                console.log(`Migrated vote by ${user?.username} for voting ${voting.title}`);
            }

            console.log(`Migrated voting ${voting.title}`);
        }

        console.log("Migration completed");
    }

    public async migrateTournamentsFromCsv() {
        if (!process.env.MIGRATION || process.env.MIGRATION !== "true") return;
        console.log(utils.consoleStyles("⚠  Migrating tournaments from CSV", ["orange", "bold", "underline"]));

        const csvFilePath = path.join(__dirname, "../constants/tournaments.csv");

        if (!fs.existsSync(csvFilePath)) {
            console.error(`CSV file not found at ${csvFilePath}`);
            return;
        }

        const fileContent = fs.readFileSync(csvFilePath, "utf-8");

        // Get access token for user creation
        const accessToken = await OsuBotService.getPublicBotToken();
        if (typeof accessToken !== "string") {
            console.error(`Failed to get public bot token`);
            return;
        }

        // Parse CSV file
        const parser = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as AsyncIterable<ICsvTournament>;

        for await (const row of parser) {
            try {
                // Parse dates
                let endDate: Date;
                let startDate: Date;
                const createdAt = new Date(row["DATE-RECEIVED"]);

                if (!row["DATE-RECEIVED"] || isNaN(createdAt.getTime())) {
                    console.error(`Invalid or missing DATE-RECEIVED for tournament ${row["T-NAME"]}`);
                    continue;
                }

                // Ensure createdAt has time component
                if (createdAt.getHours() === 0 && createdAt.getMinutes() === 0) {
                    createdAt.setHours(12, 0, 0); // Set to noon by default
                }

                if (!row["END-DATE"]) {
                    // If END-DATE is missing, use DATE-RECEIVED for both start and end dates
                    console.log(`Missing END-DATE for tournament ${row["T-NAME"]}, using DATE-RECEIVED`);
                    endDate = new Date(createdAt);
                    startDate = new Date(createdAt);
                } else {
                    endDate = new Date(row["END-DATE"]);
                    if (isNaN(endDate.getTime())) {
                        console.error(`Invalid END-DATE format for tournament ${row["T-NAME"]}`);
                        continue;
                    }
                    // Ensure endDate has time component
                    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
                        endDate.setHours(12, 0, 0); // Set to noon
                    }
                    startDate = new Date(endDate);
                    startDate.setMonth(startDate.getMonth() - 2); // 2 months before end date
                }

                // Find or create host first as we need it for attachments and messages
                let host = await UserService.findOrCreateUser(accessToken, row.HOST);
                if (!host) {
                    console.log(
                        `Failed to find/create host ${row.HOST} for tournament ${row["T-NAME"]}, using fallback host`
                    );
                    host = await UserService.findOrCreateUser(accessToken, FALLBACK_HOST_OSU_ID);
                    console.log(`Fallback host: ${host?.username}`);
                    if (!host) {
                        console.error(`Failed to find/create fallback host for tournament ${row["T-NAME"]}`);
                        continue;
                    }
                }

                // Create tournament first to get its ID for attachments
                const tournament = await new Tournament({
                    name: row["T-NAME"],
                    forumUrl: row["F-LINK"] || FALLBACK_FORUM_URL,
                    startDate,
                    endDate,
                    status: this.formatStatus(row.STATUS),
                    type: row.TYPE,
                    modes: this.constructModes(row),
                    host: host?._id,
                    isActive: this.assertActive(row.STATUS),
                    createdAt,
                    updatedAt: endDate,
                    startedReviewAt: endDate,
                }).save();

                // Create badge attachments with proper metadata
                const badgeIds: mongoose.Types.ObjectId[] = [];
                if (row.BADGE) {
                    const badge = await new Attachment({
                        originalName: `badge-${row["T-NAME"]}.png`,
                        url: row.BADGE,
                        size: 0, // Since we're bootstrapping
                        type: "image/png",
                        category: FILE_UPLOAD_CATEGORY,
                        categoryObjectId: tournament._id,
                        uploadedBy: host?._id,
                        createdAt,
                    }).save();
                    badgeIds.push(badge._id as any);
                }
                if (row.BADGE2) {
                    const badge2 = await new Attachment({
                        originalName: `badge2-${row["T-NAME"]}.png`,
                        url: row.BADGE2,
                        size: 0,
                        type: "image/png",
                        category: FILE_UPLOAD_CATEGORY,
                        categoryObjectId: tournament._id,
                        uploadedBy: host?._id,
                        createdAt,
                    }).save();
                    badgeIds.push(badge2._id as any);
                }
                if (row.BADGE3) {
                    const badge3 = await new Attachment({
                        originalName: `badge3-${row["T-NAME"]}.png`,
                        url: row.BADGE3,
                        size: 0,
                        type: "image/png",
                        category: FILE_UPLOAD_CATEGORY,
                        categoryObjectId: tournament._id,
                        uploadedBy: host?._id,
                        createdAt,
                    }).save();
                    badgeIds.push(badge3._id as any);
                }

                // Update tournament with badges
                if (badgeIds.length > 0) {
                    await Tournament.findByIdAndUpdate(tournament._id, {
                        $set: { badges: badgeIds },
                    });
                }

                // Find or create reviewers if provided
                const assignedReviewers: mongoose.Types.ObjectId[] = [];

                if (row.P1) {
                    const reviewer1 = await UserService.findOrCreateUser(accessToken, row.P1);
                    if (reviewer1) assignedReviewers.push(reviewer1._id);
                }
                if (row.P2) {
                    const reviewer2 = await UserService.findOrCreateUser(accessToken, row.P2);
                    if (reviewer2) assignedReviewers.push(reviewer2._id);
                }

                // Extract thread ID from Discord thread URL if provided
                let threadId;
                if (row.THREAD) {
                    const match = row.THREAD.match(/\/(\d+)$/);
                    if (match) threadId = match[1];
                }

                // Add reviews if verdicts are provided
                const reviews: mongoose.Types.ObjectId[] = [];
                if (row["P1 VERDICT"] && assignedReviewers[0]) {
                    const review1 = await new Review({
                        author: assignedReviewers[0],
                        vote: this.formatVerdict(row["P1 VERDICT"]),
                        checklist: this.constructChecklist(row.TYPE),
                        createdAt,
                    }).save();
                    reviews.push(review1._id as any);
                    console.log(`Migrated review 1 for ${row["T-NAME"]}`);
                }
                if (row["P2 VERDICT"] && assignedReviewers[1]) {
                    const review2 = await new Review({
                        author: assignedReviewers[1],
                        vote: this.formatVerdict(row["P2 VERDICT"]),
                        checklist: this.constructChecklist(row.TYPE),
                        createdAt,
                    }).save();
                    reviews.push(review2._id as any);
                    console.log(`Migrated review 2 for ${row["T-NAME"]}`);
                }

                // Add note if provided
                let note;
                if (row.NOTIF) {
                    note = await new Message({
                        author: assignedReviewers[0] || host?._id, // Use first reviewer or host as author
                        content: row.NOTIF,
                        isCommittee: true,
                        isNote: true,
                        createdAt,
                    }).save();
                }

                // Update tournament with remaining fields
                await Tournament.findByIdAndUpdate(tournament._id, {
                    $set: {
                        threadId,
                        assignedReviewers,
                    },
                    ...(reviews.length > 0 && { $push: { reviews: { $each: reviews } } }),
                    ...(note && { $push: { notes: note._id } }),
                });

                console.log(`Migrated tournament ${row["T-NAME"]}`);
            } catch (error) {
                console.error(`Failed to migrate tournament ${row["T-NAME"]}:`, error);
            }
        }

        console.log("Tournament migration completed");
    }

    public async migrateSingleHostToMultipleHosts() {
        if (!process.env.MIGRATION || process.env.MIGRATION !== "true") return;
        console.log(
            utils.consoleStyles("⚠  Migrating tournaments from single host to multiple hosts", [
                "orange",
                "bold",
                "underline",
            ])
        );

        try {
            // Find all tournaments that still have the old 'host' field instead of 'hosts'
            const tournamentsToMigrate = await Tournament.find({
                host: { $exists: true },
                hosts: { $exists: false },
            });

            console.log(`Found ${tournamentsToMigrate.length} tournaments to migrate`);

            let migratedCount = 0;
            let errorCount = 0;

            for (const tournament of tournamentsToMigrate) {
                try {
                    // Convert single host to hosts array
                    // @ts-expect-error - tournament.host was a thing pre-migration
                    const hostId = tournament.host;
                    if (hostId) {
                        // Set the hosts array with the single host
                        await Tournament.updateOne(
                            { _id: tournament._id },
                            {
                                $set: { hosts: [hostId] },
                                $unset: { host: 1 },
                            }
                        );
                        migratedCount++;
                        console.log(`✓ Migrated tournament: ${tournament.name}`);
                    } else {
                        console.warn(`⚠ Tournament ${tournament.name} has no host, skipping`);
                    }
                } catch (error) {
                    console.error(`✗ Failed to migrate tournament ${tournament.name}:`, error);
                    errorCount++;
                }
            }

            console.log(`\n✓ Migration completed successfully!`);
            console.log(`  - Migrated: ${migratedCount} tournaments`);
            console.log(`  - Errors: ${errorCount} tournaments`);

            // Verification step
            const verificationCount = await Tournament.countDocuments({ hosts: { $exists: true, $size: { $gte: 1 } } });
            const oldFormatCount = await Tournament.countDocuments({ host: { $exists: true } });

            console.log(`\n📊 Verification:`);
            console.log(`  - Tournaments with hosts array: ${verificationCount}`);
            console.log(`  - Tournaments with old host field: ${oldFormatCount}`);
        } catch (error) {
            console.error("Migration failed:", error);
        }
    }

    // ? utils

    private constructModes(row: ICsvTournament): string[] {
        const modes: string[] = [];
        if (row.osu.toUpperCase() === "TRUE") modes.push("osu");
        if (row.mania.toUpperCase() === "TRUE") modes.push("mania");
        if (row.taiko.toUpperCase() === "TRUE") modes.push("taiko");
        if (row.catch.toUpperCase() === "TRUE") modes.push("catch");
        return modes;
    }

    private constructChecklist(type: "tournament" | "contest"): IReviewChecklistItem[] {
        const checklist = type === "tournament" ? TC_REVIEW_CHECKLIST : CC_REVIEW_CHECKLIST;
        const constructedChecklist: IReviewChecklistItem[] = [];

        for (const category of checklist) {
            for (const item of category.items) {
                constructedChecklist.push({
                    item,
                    checked: true,
                });
            }
        }

        return constructedChecklist;
    }

    private formatStatus(status: string): string {
        if (status.includes("Badge Applied")) return "badgeApproved";
        if (status.includes("Badge Approved")) return "badgeApproved";
        if (status.includes("Badge Denied")) return "badgeRejected";
        if (status.includes("No Badge Request Received")) return "noBadgeRequested";
        if (status.includes("Screening In-Progress")) return "screeningOngoing";
        if (status.includes("Screening Completed")) return "screeningConcluded";
        if (status.includes("Under Review")) return "reviewOngoing";
        if (status.includes("Badge Needs Changes")) return "changesRequested";
        if (status.includes("Pending Resolution")) return "changesRequested";
        if (status.includes("Support Request Received")) return "supportRequestReceived";
        return "supportRequestReceived";
    }

    private formatVerdict(verdict: string): string {
        if (verdict.includes("APPROVE")) return "approve";
        if (verdict.includes("ON HOLD")) return "changesRequested";
        if (verdict.includes("DENY")) return "deny";
        return "approve";
    }

    private assertActive(status: string): boolean {
        if (status.includes("Badge Applied")) return false;
        if (status.includes("Badge Denied")) return false;
        if (status.includes("No Badge Request Received")) return false;
        return true;
    }
}

interface IPif2Vote {
    comment?: string | null;
    user_id: number;
    discussion_id: number;
    voting_option_id: number;
    user: {
        id: number;
        username: string;
        osu_id: number;
    };
    voting_option: {
        id: number;
        discussion_id: number;
        option: string;
    };
}

interface IPif2VotingOption {
    id: number;
    discussion_id: number;
    option: string;
}

interface IPif2User {
    id: number;
    username: string;
    osu_id: number;
}

interface IPif2Voting {
    id: number;
    user_id: number;
    description: string;
    title: string;
    deadline: string;
    participant_threshold: number;
    user: IPif2User;
    voting_options: IPif2VotingOption[];
    votes: IPif2Vote[];
}

interface ICsvTournament {
    "DATE-RECEIVED": string;
    "END-DATE": string;
    "F-LINK": string;
    "T-NAME": string;
    TYPE: "tournament" | "contest";
    HOST: string;
    osu: string;
    mania: string;
    taiko: string;
    catch: string;
    BADGE: string;
    BADGE2?: string;
    BADGE3?: string;
    STATUS: string;
    NOTIF?: string;
    THREAD?: string;
    P1?: string;
    P2?: string;
    "P1 VERDICT"?: string;
    "P2 VERDICT"?: string;
}

export default new MigrationService();
