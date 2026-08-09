import BaseMigration from "./BaseMigration";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { parse as parseCsv } from "csv-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import Attachment from "@tc/models/attachmentModel";
import Tournament from "@tc/models/tournamentModel";
import Review from "@tc/models/reviewModel";
import Message from "@tc/models/messageModel";
import mongoose from "mongoose";
import UserService from "@tc/osu/UserService";
import OsuBotService from "@tc/osu/OsuBotService";
import { IReviewChecklistItem } from "@tc/types/Review";
import checklist from "../../../checklist.json";

const FALLBACK_HOST_OSU_ID = "37548950";
const FALLBACK_FORUM_URL = "https://osu.ppy.sh/community/forums/topics/1715676";
const FILE_UPLOAD_CATEGORY = "tournaments";

const TC_REVIEW_CHECKLIST = checklist.tc;
const CC_REVIEW_CHECKLIST = checklist.cc;

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

export default class TournamentsFromCsvMigration extends BaseMigration {
    name = "TournamentsFromCsv";
    description = "Migrating tournaments from CSV";

    protected async execute(): Promise<void> {
        // This should probably change, but 99% chance we won't ever run this again so /shrug
        const csvFilePath = path.join(__dirname, "../constants/tournaments.csv");

        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at ${csvFilePath}`);
        }

        const fileContent = fs.readFileSync(csvFilePath, "utf-8");

        // Get access token for user creation
        const accessToken = await OsuBotService.getPublicBotToken();
        if (typeof accessToken !== "string") {
            throw new Error("Failed to get public bot token");
        }

        // Parse CSV file
        const parser = parseCsv(fileContent, {
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
                    this.log(`Invalid or missing DATE-RECEIVED for tournament ${row["T-NAME"]}`);
                    continue;
                }

                // Ensure createdAt has time component
                if (createdAt.getHours() === 0 && createdAt.getMinutes() === 0) {
                    createdAt.setHours(12, 0, 0); // Set to noon by default
                }

                if (!row["END-DATE"]) {
                    // If END-DATE is missing, use DATE-RECEIVED for both start and end dates
                    this.log(`Missing END-DATE for tournament ${row["T-NAME"]}, using DATE-RECEIVED`);
                    endDate = new Date(createdAt);
                    startDate = new Date(createdAt);
                } else {
                    endDate = new Date(row["END-DATE"]);
                    if (isNaN(endDate.getTime())) {
                        this.log(`Invalid END-DATE format for tournament ${row["T-NAME"]}`);
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
                    this.log(
                        `Failed to find/create host ${row.HOST} for tournament ${row["T-NAME"]}, using fallback host`,
                    );
                    host = await UserService.findOrCreateUser(accessToken, FALLBACK_HOST_OSU_ID);
                    this.log(`Fallback host: ${host?.username}`);
                    if (!host) {
                        this.log(`Failed to find/create fallback host for tournament ${row["T-NAME"]}`);
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
                    this.log(`Migrated review 1 for ${row["T-NAME"]}`);
                }
                if (row["P2 VERDICT"] && assignedReviewers[1]) {
                    const review2 = await new Review({
                        author: assignedReviewers[1],
                        vote: this.formatVerdict(row["P2 VERDICT"]),
                        checklist: this.constructChecklist(row.TYPE),
                        createdAt,
                    }).save();
                    reviews.push(review2._id as any);
                    this.log(`Migrated review 2 for ${row["T-NAME"]}`);
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

                this.log(`Migrated tournament ${row["T-NAME"]}`);
            } catch (error) {
                this.log(`Failed to migrate tournament ${row["T-NAME"]}: ${error}`);
            }
        }
    }

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
