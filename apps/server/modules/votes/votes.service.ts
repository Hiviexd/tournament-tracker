import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from "@nestjs/common";
import type { Session } from "express-session";
import Voting from "@tc/models/votingModel";
import Vote from "@tc/models/voteModel";
import type { VotingQueryParams, VotingListQuery } from "@tc/types/Voting";
import User from "@tc/models/userModel";
import type { IUser } from "@tc/types/User";
import { EmbedBuilder } from "@tc/notifications/discord/EmbedBuilder";
import { WebhookBuilder } from "@tc/notifications/discord/WebhookBuilder";
import DiscordUtils from "@tc/notifications/discord/DiscordUtils";
import config from "@tc/config";
import LogService from "@tc/models/LogService";
import utils from "@tc/utils/server";
import UploadService from "../../services/UploadService";
import { VotingService } from "../../services/VotingService";
import { generateDiscordVotingResults } from "@tc/notifications/votingResults";

const DEFAULT_POPULATE = [
    { path: "author", select: "username osuId groups coverUrl country" },
    {
        path: "votes",
        populate: {
            path: "author",
            select: "username osuId groups coverUrl country",
        },
    },
    { path: "targetUser", select: "username osuId groups coverUrl country" },
    { path: "attachments", select: "originalName url size type" },
    { path: "abstainedUsers", select: "username osuId groups coverUrl country" },
];

const DEFAULT_LIMIT = 10;

const STRICT_PARTICIPATION_PERCENTAGE = 0.75;

const FILE_UPLOAD_CATEGORY = "votings";

@Injectable()
export class VotesService {
    constructor(private readonly votingService: VotingService) {}

    async index(reqQuery: VotingListQuery, user: IUser | undefined) {
        const dbQuery: VotingQueryParams = {};

        if (reqQuery.title) dbQuery.title = new RegExp(utils.escapeRegexPattern(reqQuery.title), "i");
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.assignedGroup) dbQuery.assignedGroups = { $in: [reqQuery.assignedGroup] };
        if (reqQuery.visibility) dbQuery.isPublic = reqQuery.visibility === "public";
        if (reqQuery.status) dbQuery.isActive = reqQuery.status === "active";

        if (!user || !user.isCommitteeOrAdmin) {
            dbQuery.isActive = false;
            dbQuery.isPublic = true;
        }

        if (reqQuery.showNeedsAttention === "true" && user && user.isCommittee) {
            dbQuery.isActive = true;
            dbQuery.$or = [
                { assignedGroups: "tc", $expr: { $eq: [user.isTournamentCommittee, true] } },
                { assignedGroups: "cc", $expr: { $eq: [user.isContestCommittee, true] } },
            ];
        }

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        const total = await Voting.countDocuments(dbQuery);

        let votings = await Voting.find(dbQuery)
            .skip(skip)
            .limit(DEFAULT_LIMIT)
            .sort({ createdAt: -1 })
            .populate(DEFAULT_POPULATE);

        if (reqQuery.showNeedsAttention === "true" && user && user.isCommittee) {
            votings = votings.filter((voting) => !voting.votes.some((vote) => vote.author._id.equals(user._id)));
        }

        if (!user || !user.isCommitteeOrAdmin) {
            votings = votings.map((voting) => this.votingService.censorVotingForNonCommittee(voting)) as typeof votings;
        }

        return {
            votings,
            total,
            page,
            pages: Math.ceil(total / DEFAULT_LIMIT),
        };
    }

    async getVoting(votingId: string, user: IUser | undefined) {
        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        if ((!user || !user.isCommitteeOrAdmin) && (voting.isActive || !voting.isPublic)) {
            throw new ForbiddenException("You can only view concluded public votes");
        }

        if (!user || !user.isCommitteeOrAdmin) {
            return this.votingService.censorVotingForNonCommittee(voting);
        }

        return voting;
    }

    async createVoting(
        body: {
            category: string;
            assignedGroups: string[];
            title: string;
            description: string;
            duration: number;
            options: string[];
            targetUserId?: string;
            targetTournamentName?: string;
            targetTournamentLink?: string;
            type: string;
            allowNeutralVotes?: boolean | string;
            forceFullParticipation?: boolean | string;
            binaryStrictPassThreshold?: number;
        },
        files: Express.Multer.File[] | undefined,
        author: IUser,
        session: Session,
    ) {
        const {
            category,
            assignedGroups,
            title,
            description,
            duration,
            options,
            targetUserId,
            targetTournamentName,
            targetTournamentLink,
            type,
            allowNeutralVotes,
            forceFullParticipation,
            binaryStrictPassThreshold,
        } = body;

        const assignedUsersCount = await User.countDocuments({
            groups: { $in: assignedGroups },
            isActiveVoter: true,
        });

        const forceFullParticipationBool = forceFullParticipation === true || forceFullParticipation === "true";

        const requiredVotes = forceFullParticipationBool
            ? assignedUsersCount
            : Math.ceil(STRICT_PARTICIPATION_PERCENTAGE * assignedUsersCount);

        let neutralVotesSettingOverride = allowNeutralVotes;
        if (type === "ranked-choice") neutralVotesSettingOverride = true;

        const voting = new Voting({
            author,
            category,
            assignedGroups,
            title,
            description,
            duration,
            type,
            options,
            requiredVotes,
            allowNeutralVotes: neutralVotesSettingOverride,
            binaryStrictPassThreshold: type === "binary-strict" ? binaryStrictPassThreshold : undefined,
        });

        if (category === "user") {
            if (!targetUserId) {
                throw new BadRequestException("Missing target user ID");
            }

            voting.targetUser = await User.findById(targetUserId).orFail();
        }

        if (category === "tournament") {
            if (!targetTournamentName || !targetTournamentLink) {
                throw new BadRequestException("Missing target tournament details");
            }

            const sanitizedTournamentName = targetTournamentName.trim();
            const sanitizedTournamentLink = targetTournamentLink.trim();

            if (sanitizedTournamentName.length < 5 || sanitizedTournamentName.length > 120) {
                throw new BadRequestException("Tournament name must be between 5 and 120 characters");
            }

            if (!utils.isOsuForumLink(sanitizedTournamentLink)) {
                throw new BadRequestException("Invalid tournament forum link");
            }

            voting.targetTournamentName = sanitizedTournamentName;
            voting.targetTournamentLink = sanitizedTournamentLink;
        }

        if (files?.length) {
            voting.attachments = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                voting.id,
                author.id,
            );
        }

        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting",
        );

        const roles: ("tournament" | "contest")[] = [];

        if (voting.assignedGroups.includes("tc")) roles.push("tournament");
        if (voting.assignedGroups.includes("cc")) roles.push("contest");

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setDescription(
                `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            )
            .setColor(DiscordUtils.webhookColors.lightYellow)
            .setFooter(`ID: ${voting._id}`)
            .addField(
                "Deadline",
                `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(voting.deadline, "dateTime")})`,
            );

        if (voting.targetUser) {
            embed.addField(
                "Target User",
                `[**${voting.targetUser.username}**](https://osu.ppy.sh/users/${voting.targetUser.osuId})`,
            );
        }

        if (voting.targetTournamentName && voting.targetTournamentLink) {
            embed.addField("Target Tournament", `[**${voting.targetTournamentName}**](${voting.targetTournamentLink})`);
        }

        embed.addField("Description", utils.shorten(voting.description, 1024));

        if (voting.attachments?.length) {
            const attachmentsField = utils.getAttachmentsField(voting.attachments)!;
            embed.addField(attachmentsField.name, attachmentsField.value, attachmentsField.inline);
        }

        if (forceFullParticipation) {
            embed.addField("Participation Requirement", forceFullParticipationBool ? "100%" : "75%");
        }

        if (voting.type === "binary-strict") {
            embed.addField("Pass Threshold", `${voting.binaryStrictPassThreshold}%`);
        }

        await new WebhookBuilder().addEmbed(embed).addRoles(roles).setMessage("New Vote").send();

        return {
            message: "Vote created successfully!",
            voting,
        };
    }

    async submitVote(
        votingId: string,
        body: { data: any; comment?: string },
        author: IUser,
        session: Session,
    ) {
        const { data, comment } = body;

        const voting = await Voting.findById(votingId).populate("votes").orFail();

        if (!voting.isActive) {
            throw new BadRequestException("Vote is not active!");
        }

        if (voting.abstainedUsers?.some((abstainedUser) => abstainedUser._id.equals(author._id))) {
            throw new BadRequestException("You are abstained from this vote!");
        }

        if (data.type !== voting.type) {
            throw new BadRequestException("Vote type does not match voting type!");
        }

        const requiresComment = true;

        if (requiresComment && (!comment || comment.trim().length === 0)) {
            throw new BadRequestException("Vote comment is required.");
        }

        switch (data.type) {
            case "classic":
                if (typeof data.option !== "number" || data.option >= voting.options.length) {
                    throw new BadRequestException("Invalid option index");
                }
                break;
            case "binary":
                if (typeof data.score !== "number" || data.score < -5 || data.score > 5) {
                    throw new BadRequestException("Invalid score (must be between -5 and 5)");
                }
                if (!voting.allowNeutralVotes && data.score === 0) {
                    throw new BadRequestException("Neutral votes (score of 0) are not allowed for this voting");
                }
                break;
            case "variable":
                if (
                    !Array.isArray(data.scores) ||
                    !data.scores.every(
                        (s: any) =>
                            typeof s.optionIndex === "number" &&
                            s.optionIndex < voting.options.length &&
                            typeof s.score === "number" &&
                            s.score >= -5 &&
                            s.score <= 5,
                    )
                ) {
                    throw new BadRequestException("Invalid scores");
                }
                if (!voting.allowNeutralVotes && data.scores.some((s: any) => s.score === 0)) {
                    throw new BadRequestException("Neutral votes (score of 0) are not allowed for this voting");
                }
                break;
            case "binary-strict":
                if (typeof data.score !== "number" || data.score < -1 || data.score > 1) {
                    throw new BadRequestException("Invalid score (must be between -1 and 1)");
                }
                if (!voting.allowNeutralVotes && data.score === 0) {
                    throw new BadRequestException("Neutral votes (score of 0) are not allowed for this voting");
                }
                break;
            case "ranked-choice":
                if (
                    !Array.isArray(data.scores) ||
                    !data.scores.every(
                        (s: any) =>
                            typeof s.optionIndex === "number" &&
                            s.optionIndex < voting.options.length &&
                            typeof s.score === "number" &&
                            s.score >= -2 &&
                            s.score <= 2,
                    )
                ) {
                    throw new BadRequestException("Invalid scores (must be between -2 and 2)");
                }
                if (!voting.allowNeutralVotes && data.scores.some((s: any) => s.score === 0)) {
                    throw new BadRequestException("Neutral votes (score of 0) are not allowed for this voting");
                }
                break;
        }

        const existingVote = voting.votes.find((vote) => vote.author._id.equals(author._id));
        let vote;
        let isNewVote = false;

        if (!existingVote) {
            vote = new Vote({
                author,
                comment,
                data,
            });
            isNewVote = true;
        } else {
            vote = await Vote.findById(existingVote._id);
            if (vote) {
                vote.comment = comment;
                vote.data = data;
            }
        }

        if (vote) {
            await vote.save();
        }

        if (isNewVote) {
            voting.votes.push(vote);
            await voting.save();
        }

        if (isNewVote) {
            await LogService.generate(
                session.mongoId!,
                `Submitted a vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                "voting",
            );
        }

        return {
            message: "Vote submitted successfully!",
            voting,
        };
    }

    async toggleVotingStatus(votingId: string, session: Session) {
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        voting.isActive = !voting.isActive;
        voting.concludedAt = voting.isActive ? undefined : new Date();
        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Toggled vote status for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${
                voting.isActive ? "active" : "inactive"
            }`,
            "voting",
        );

        if (!voting.isActive) {
            const fields = generateDiscordVotingResults(voting);

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                .setColor(DiscordUtils.webhookColors.darkYellow)
                .setDescription(`Concluded vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`);

            for (const field of fields) {
                embed.addField(field.name, field.value, field.inline);
            }

            await new WebhookBuilder().addEmbed(embed).send();
        } else {
            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                .setDescription(`Resumed vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                .setColor(DiscordUtils.webhookColors.yellow);

            await new WebhookBuilder().addEmbed(embed).send();
        }

        return {
            message: `Vote status is now ${voting.isActive ? "active" : "concluded"}`,
        };
    }

    async updateVoting(
        votingId: string,
        body: {
            title: string;
            description: string;
            duration: number;
            options: string[];
            publicDescription?: string;
            allowNeutralVotes?: boolean;
            category?: string;
            targetUserId?: string;
            targetTournamentName?: string;
            targetTournamentLink?: string;
        },
        session: Session,
    ) {
        const {
            title,
            description,
            duration,
            options,
            publicDescription,
            allowNeutralVotes,
            category,
            targetUserId,
            targetTournamentName,
            targetTournamentLink,
        } = body;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            if (category) {
                voting.category = category as any;

                if (category === "user" && targetUserId) {
                    voting.targetUser = await User.findById(targetUserId).orFail();
                    voting.targetTournamentName = undefined;
                    voting.targetTournamentLink = undefined;
                } else if (category === "tournament" && targetTournamentName && targetTournamentLink) {
                    voting.targetTournamentName = targetTournamentName;
                    voting.targetTournamentLink = targetTournamentLink;
                    voting.targetUser = undefined;
                } else if (category === "discussion") {
                    voting.targetUser = undefined;
                    voting.targetTournamentName = undefined;
                    voting.targetTournamentLink = undefined;
                }
            }
        }

        voting.title = title;
        voting.description = description;
        voting.duration = duration;
        voting.publicDescription = publicDescription;
        if (allowNeutralVotes !== undefined) {
            voting.allowNeutralVotes = allowNeutralVotes;
        }

        if (!voting.votes.length) voting.options = options;

        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Updated the vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting",
        );

        return {
            message: "Vote updated successfully!",
            voting,
        };
    }

    async deleteVoting(votingId: string, session: Session) {
        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            throw new BadRequestException("Cannot delete concluded votes!");
        }

        if (voting.votes.length) {
            throw new BadRequestException("Cannot delete voting with votes!");
        }

        await voting.deleteOne();

        await LogService.generate(
            session.mongoId!,
            `Deleted the vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setDescription(`Deleted a vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                    .setColor(DiscordUtils.webhookColors.darkRed),
            )
            .send();

        return {
            message: "Vote deleted successfully!",
        };
    }

    async toggleVotingPublic(votingId: string, session: Session) {
        const voting = await Voting.findById(votingId).orFail();

        if (voting.isActive) {
            throw new BadRequestException("Cannot change publicity of active votes");
        }

        voting.isPublic = !voting.isPublic;
        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                voting.isPublic ? "public" : "private"
            }`,
            "voting",
        );

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
            .setDescription(
                `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                    voting.isPublic ? "available for **public** viewing" : "private"
                }`,
            )
            .setColor(voting.isPublic ? DiscordUtils.webhookColors.lightPurple : DiscordUtils.webhookColors.darkPurple);

        await new WebhookBuilder().addEmbed(embed).send();

        return {
            message: `Vote is now ${voting.isPublic ? "public" : "private"}`,
        };
    }

    async clearVotes(votingId: string, session: Session) {
        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            throw new BadRequestException("Cannot handle concluded votes!");
        }

        voting.votes = [];
        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Cleared all votes from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setDescription(
                        `Cleared all votes from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                    )
                    .setColor(DiscordUtils.webhookColors.red),
            )
            .send();

        return {
            message: "Votes cleared successfully!",
        };
    }

    async toggleAbstention(votingId: string, user: IUser, session: Session) {
        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        if (!voting.isActive) {
            throw new BadRequestException("Cannot handle concluded votes!");
        }

        if (voting.votes.some((vote) => vote.author._id.equals(user._id))) {
            throw new BadRequestException("You have already submitted a vote!");
        }

        let isAbstained: boolean;

        const originalRequiredVotes = voting.requiredVotes;

        if (!voting.abstainedUsers) {
            voting.abstainedUsers = [];
        }

        const userIndex = voting.abstainedUsers.findIndex((abstainedUser) => abstainedUser._id.equals(user._id));

        if (userIndex >= 0) {
            voting.abstainedUsers.splice(userIndex, 1);
            voting.requiredVotes++;
            isAbstained = false;
        } else {
            voting.abstainedUsers.push(user);
            voting.requiredVotes--;
            isAbstained = true;
        }

        if (voting.requiredVotes < 1) {
            throw new BadRequestException("Cannot abstain: would result in no required votes!");
        }

        await voting.save();

        await LogService.generate(
            session.mongoId!,
            `Toggled abstention for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${
                isAbstained ? "true" : "false"
            }`,
            "voting",
        );

        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(session))
                    .setDescription(
                        `${isAbstained ? "Abstained" : "Removed abstention"} from vote: [**${voting.title}**](${
                            config.baseUrl
                        }/votes/${voting._id})`,
                    )
                    .setColor(isAbstained ? DiscordUtils.webhookColors.darkGray : DiscordUtils.webhookColors.white)
                    .setFooter(`Required votes: ${originalRequiredVotes} → ${voting.requiredVotes}`),
            )
            .send();

        return {
            message: `You ${isAbstained ? "have abstained" : "are no longer abstained"} from this vote!`,
        };
    }
}
