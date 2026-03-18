import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams, VotingListQuery } from "../../interfaces/Voting";
import User from "../models/userModel";
import { IUser } from "../../interfaces/User";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import config from "../../config.json";
import LogService from "../services/LogService";
import utils from "../../utils";
import { Request, Response } from "express";
import UploadService from "../services/UploadService";
import VotingService from "../services/VotingService";

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

class VotingsController {
    /** GET voting listing */
    public async index(req: Request, res: Response) {
        const reqQuery = req.query as VotingListQuery;
        const dbQuery: VotingQueryParams = {};
        const user = res.locals!.user;

        if (reqQuery.title) dbQuery.title = new RegExp(utils.escapeRegexPattern(reqQuery.title), "i");
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.assignedGroup) dbQuery.assignedGroups = { $in: [reqQuery.assignedGroup] };
        if (reqQuery.visibility) dbQuery.isPublic = reqQuery.visibility === "public";
        if (reqQuery.status) dbQuery.isActive = reqQuery.status === "active";

        // Only show concluded AND public votes to non-committee members
        if (!user || !user.isCommitteeOrAdmin) {
            dbQuery.isActive = false;
            dbQuery.isPublic = true;
        }

        // Handle needs attention filter for committee members
        if (reqQuery.showNeedsAttention === "true" && user && user.isCommittee) {
            dbQuery.isActive = true;
            // First find votings where user is in assigned groups
            dbQuery.$or = [
                { assignedGroups: "tc", $expr: { $eq: [user.isTournamentCommittee, true] } },
                { assignedGroups: "cc", $expr: { $eq: [user.isContestCommittee, true] } },
            ];
        }

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        // Get total count before pagination
        const total = await Voting.countDocuments(dbQuery);

        let votings = await Voting.find(dbQuery)
            .skip(skip)
            .limit(DEFAULT_LIMIT)
            .sort({ createdAt: -1 })
            .populate(DEFAULT_POPULATE);

        // Filter out votings where user has already voted if needs attention is true
        if (reqQuery.showNeedsAttention === "true" && user && user.isCommittee) {
            votings = votings.filter((voting) => !voting.votes.some((vote) => vote.author._id.equals(user._id)));
        }

        // Censor votings for non-committee members
        if (!user || !user.isCommitteeOrAdmin) {
            votings = votings.map((voting) => VotingService.censorVotingForNonCommittee(voting));
        }

        res.json({
            votings,
            total,
            page,
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET a voting */
    public async getVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const user = res.locals!.user;

        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        // Non-committee members can only view concluded public votes
        if ((!user || !user.isCommitteeOrAdmin) && (voting.isActive || !voting.isPublic)) {
            return res.status(403).json({ error: "You can only view concluded public votes" });
        }

        // Censor voting for non-committee members
        if (!user || !user.isCommitteeOrAdmin) {
            return res.json(VotingService.censorVotingForNonCommittee(voting));
        }

        res.json(voting);
    }

    /** POST create a voting */
    public async createVoting(req: Request, res: Response) {
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
        } = req.body;
        const files = req.files as Express.Multer.File[];

        const author = res.locals!.user!;
        let targetUser: IUser;

        // Count only active voters in assigned groups
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
                return res.status(400).json({ error: "Missing target user ID" });
            }

            targetUser = await User.findById(targetUserId).orFail();
            voting.targetUser = targetUser;
        }

        if (category === "tournament") {
            if (!targetTournamentName || !targetTournamentLink) {
                return res.status(400).json({ error: "Missing target tournament details" });
            }

            const sanitizedTournamentName = targetTournamentName.trim();
            const sanitizedTournamentLink = targetTournamentLink.trim();

            if (sanitizedTournamentName.length < 5 || sanitizedTournamentName.length > 120)
                return res.status(400).json({ error: "Tournament name must be between 5 and 120 characters" });

            if (!utils.isOsuForumLink(sanitizedTournamentLink))
                return res.status(400).json({ error: "Invalid tournament forum link" });

            voting.targetTournamentName = sanitizedTournamentName;
            voting.targetTournamentLink = sanitizedTournamentLink;
        }

        // Handle file uploads
        if (files?.length) {
            voting.attachments = await UploadService.handleFileUploads(
                files,
                FILE_UPLOAD_CATEGORY,
                voting.id,
                author.id
            );
        }

        await voting.save();

        res.json({
            message: "Vote created successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );

        // Discord
        const roles: ("tournament" | "contest")[] = [];

        if (voting.assignedGroups.includes("tc")) roles.push("tournament");
        if (voting.assignedGroups.includes("cc")) roles.push("contest");

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`
            )
            .setColor(DiscordUtils.webhookColors.lightYellow)
            .setFooter(`ID: ${voting._id}`)
            .addField(
                "Deadline",
                `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(voting.deadline, "dateTime")})`
            );

        if (voting.targetUser) {
            embed.addField(
                "Target User",
                `[**${voting.targetUser.username}**](https://osu.ppy.sh/users/${voting.targetUser.osuId})`
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
    }

    /** POST submit vote */
    public async submitVote(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const { data, comment } = req.body;

        const author = res.locals!.user!;
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        if (!voting.isActive) {
            return res.status(400).json({ message: "Vote is not active!" });
        }

        if (voting.abstainedUsers?.some((abstainedUser) => abstainedUser._id.equals(author._id))) {
            return res.status(400).json({ error: "You are abstained from this vote!" });
        }

        // Validate vote based on voting type
        if (data.type !== voting.type) {
            return res.status(400).json({ error: "Vote type does not match voting type!" });
        }

        // We want comments to always be required now.
        // Keeping previous logic commented out for preservation
        const requiresComment = true;

        /*
        const isExtremeVote = (value: number) => Math.abs(value) >= 4;

        // Check if comment is required based on vote type and values
        switch (data.type) {
            case "binary":
                requiresComment = isExtremeVote(data.score);
                break;
            case "variable":
                requiresComment = data.scores.some((s) => isExtremeVote(s.score));
                break;
        }
        */

        if (requiresComment && (!comment || comment.trim().length === 0)) {
            return res.status(400).json({ error: "Vote comment is required." });
        }

        // Validate vote data based on type
        switch (data.type) {
            case "classic":
                if (typeof data.option !== "number" || data.option >= voting.options.length) {
                    return res.status(400).json({ error: "Invalid option index" });
                }
                break;
            case "binary":
                if (typeof data.score !== "number" || data.score < -5 || data.score > 5) {
                    return res.status(400).json({ error: "Invalid score (must be between -5 and 5)" });
                }
                if (!voting.allowNeutralVotes && data.score === 0) {
                    return res
                        .status(400)
                        .json({ error: "Neutral votes (score of 0) are not allowed for this voting" });
                }
                break;
            case "variable":
                if (
                    !Array.isArray(data.scores) ||
                    !data.scores.every(
                        (s) =>
                            typeof s.optionIndex === "number" &&
                            s.optionIndex < voting.options.length &&
                            typeof s.score === "number" &&
                            s.score >= -5 &&
                            s.score <= 5
                    )
                ) {
                    return res.status(400).json({ error: "Invalid scores" });
                }
                if (!voting.allowNeutralVotes && data.scores.some((s) => s.score === 0)) {
                    return res
                        .status(400)
                        .json({ error: "Neutral votes (score of 0) are not allowed for this voting" });
                }
                break;
            case "binary-strict":
                if (typeof data.score !== "number" || data.score < -1 || data.score > 1) {
                    return res.status(400).json({ error: "Invalid score (must be between -1 and 1)" });
                }
                if (!voting.allowNeutralVotes && data.score === 0) {
                    return res
                        .status(400)
                        .json({ error: "Neutral votes (score of 0) are not allowed for this voting" });
                }
                break;
            case "ranked-choice":
                if (
                    !Array.isArray(data.scores) ||
                    !data.scores.every(
                        (s) =>
                            typeof s.optionIndex === "number" &&
                            s.optionIndex < voting.options.length &&
                            typeof s.score === "number" &&
                            s.score >= -2 &&
                            s.score <= 2
                    )
                ) {
                    return res.status(400).json({ error: "Invalid scores (must be between -2 and 2)" });
                }
                if (!voting.allowNeutralVotes && data.scores.some((s) => s.score === 0)) {
                    return res
                        .status(400)
                        .json({ error: "Neutral votes (score of 0) are not allowed for this voting" });
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
            // Find and update the existing vote document
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

        res.json({
            message: "Vote submitted successfully!",
            voting,
        });

        if (isNewVote) {
            // Logger
            await LogService.generate(
                req.session.mongoId!,
                `Submitted a vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                "voting"
            );

            // Discord
            // ! Disabled per team request
            /*
            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                        .setDescription(`Submitted a vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                        .setColor(DiscordUtils.webhookColors.lightGreen)
                )
                .setNotification("silent")
                .send();
            */
        }
    }

    /** POST toggle voting status */
    public async toggleVotingStatus(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).populate("votes").orFail();

        voting.isActive = !voting.isActive;
        voting.concludedAt = voting.isActive ? undefined : new Date();
        await voting.save();

        res.json({
            message: `Vote status is now ${voting.isActive ? "active" : "concluded"}`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Toggled vote status for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${
                voting.isActive ? "active" : "inactive"
            }`,
            "voting"
        );

        // Only send results if concluding the vote
        if (!voting.isActive) {
            const fields = VotingService.generateDiscordVotingResults(voting);

            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(DiscordUtils.webhookColors.darkYellow)
                .setDescription(`Concluded vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`);

            for (const field of fields) {
                embed.addField(field.name, field.value, field.inline);
            }

            await new WebhookBuilder().addEmbed(embed).send();
        } else {
            // Voting resumed
            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setDescription(`Resumed vote for [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                .setColor(DiscordUtils.webhookColors.yellow);

            await new WebhookBuilder().addEmbed(embed).send();
        }
    }

    /** POST update voting */
    public async updateVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;
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
        } = req.body;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            if (category) {
                voting.category = category;

                if (category === "user" && targetUserId) {
                    // user vote - assign user and clear tournament details
                    voting.targetUser = await User.findById(targetUserId).orFail();
                    voting.targetTournamentName = undefined;
                    voting.targetTournamentLink = undefined;
                } else if (category === "tournament" && targetTournamentName && targetTournamentLink) {
                    // tournament vote - assign tournament details and clear user details
                    voting.targetTournamentName = targetTournamentName;
                    voting.targetTournamentLink = targetTournamentLink;
                    voting.targetUser = undefined;
                } else if (category === "discussion") {
                    // discussion vote - clear all details
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
        voting.allowNeutralVotes = allowNeutralVotes;

        // only update options when there is no votes
        if (!voting.votes.length) voting.options = options;

        await voting.save();

        res.json({
            message: "Vote updated successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Updated the vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );
    }

    /** POST delete a voting */
    public async deleteVoting(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.status(400).json({ error: "Cannot delete concluded votes!" });
        }

        if (voting.votes.length) {
            return res.status(400).json({ error: "Cannot delete voting with votes!" });
        }

        await voting.deleteOne();

        res.json({
            message: "Vote deleted successfully!",
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Deleted the vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(`Deleted a vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                    .setColor(DiscordUtils.webhookColors.darkRed)
            )
            .send();
    }

    /** POST toggle voting public */
    public async toggleVotingPublic(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).orFail();

        if (voting.isActive) {
            return res.status(400).json({ error: "Cannot change publicity of active votes" });
        }

        voting.isPublic = !voting.isPublic;
        await voting.save();

        res.json({
            message: `Vote is now ${voting.isPublic ? "public" : "private"}`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                voting.isPublic ? "public" : "private"
            }`,
            "voting"
        );

        // Discord
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                    voting.isPublic ? "available for **public** viewing" : "private"
                }`
            )
            .setColor(voting.isPublic ? DiscordUtils.webhookColors.lightPurple : DiscordUtils.webhookColors.darkPurple);

        await new WebhookBuilder().addEmbed(embed).send();
    }

    /** POST delete all votes from a voting */
    public async clearVotes(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).orFail();

        if (!voting.isActive) {
            return res.status(400).json({ error: "Cannot handle concluded votes!" });
        }

        voting.votes = [];
        await voting.save();

        res.json({
            message: "Votes cleared successfully!",
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Cleared all votes from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting"
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(
                        `Cleared all votes from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`
                    )
                    .setColor(DiscordUtils.webhookColors.red)
            )
            .send();
    }

    /** PATCH toggle abstention */
    public async toggleAbstention(req: Request, res: Response) {
        const votingId = req.params.votingId;

        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        if (!voting.isActive) {
            return res.status(400).json({ error: "Cannot handle concluded votes!" });
        }

        const user = res.locals!.user!;

        // check if user already submitted a vote
        if (voting.votes.some((vote) => vote.author._id.equals(user._id))) {
            return res.status(400).json({ error: "You have already submitted a vote!" });
        }

        let isAbstained: boolean;

        const originalRequiredVotes = voting.requiredVotes;

        if (!voting.abstainedUsers) {
            voting.abstainedUsers = [];
        }

        // check if user is already abstained (comparing by _id)
        const userIndex = voting.abstainedUsers.findIndex((abstainedUser) => abstainedUser._id.equals(user._id));

        if (userIndex >= 0) {
            // user is abstained, remove them
            voting.abstainedUsers.splice(userIndex, 1);
            voting.requiredVotes++;
            isAbstained = false;
        } else {
            // user is not abstained, add them
            voting.abstainedUsers.push(user);
            voting.requiredVotes--;
            isAbstained = true;
        }

        if (voting.requiredVotes < 1) {
            return res.status(400).json({
                error: "Cannot abstain: would result in no required votes!",
            });
        }

        await voting.save();

        res.json({
            message: `You ${isAbstained ? "have abstained" : "are no longer abstained"} from this vote!`,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Toggled abstention for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${
                isAbstained ? "true" : "false"
            }`,
            "voting"
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(
                        `${isAbstained ? "Abstained" : "Removed abstention"} from vote: [**${voting.title}**](${
                            config.baseUrl
                        }/votes/${voting._id})`
                    )
                    .setColor(isAbstained ? DiscordUtils.webhookColors.darkGray : DiscordUtils.webhookColors.white)
                    .setFooter(`Required votes: ${originalRequiredVotes} → ${voting.requiredVotes}`)
            )
            .send();
    }
}

export default new VotingsController();
