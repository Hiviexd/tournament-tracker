import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import { VotingQueryParams, VOTING_CATEGORIES, SANCTION_BAN_TYPES } from "@tc/types/Voting";
import { DiscordRoleName } from "@tc/types/NotificationJob";
import { areSanctionVoteOptions } from "@tc/utils";
import startCase from "lodash/startCase.js";
import { TIME_BASED_TYPES } from "@tc/types/Infringement";
import User from "../models/userModel";
import { USER_GROUPS } from "@tc/types/User";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import config from "@tc/config";
import LogService from "../services/LogService";
import utils from "@tc/utils/server";
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
    {
        path: "targetUsers",
        select: "username osuId groups coverUrl country",
        populate: { path: "infringements" },
    },
    { path: "attachments", select: "originalName url size type" },
    { path: "abstainedUsers", select: "username osuId groups coverUrl country" },
];

const DEFAULT_LIMIT = 10;

const FILE_UPLOAD_CATEGORY = "votings";

class VotingsController {
    /** GET voting listing */
    public async index(req: Request, res: Response) {
        const title = utils.isString(req.query.title) ? req.query.title : undefined;
        const category = utils.isString(req.query.category)
            ? utils.pickStringUnion(req.query.category, VOTING_CATEGORIES)
            : undefined;
        const assignedGroup = utils.isString(req.query.assignedGroup)
            ? utils.pickStringUnion(req.query.assignedGroup, USER_GROUPS)
            : undefined;
        const visibility = utils.isString(req.query.visibility) ? req.query.visibility : undefined;
        const status = utils.isString(req.query.status) ? req.query.status : undefined;
        const showNeedsAttention = utils.isString(req.query.showNeedsAttention)
            ? req.query.showNeedsAttention
            : undefined;
        const dbQuery: VotingQueryParams = {};
        const user = res.locals!.user;

        if (title) dbQuery.title = new RegExp(utils.escapeRegexPattern(title), "i");
        if (category) dbQuery.category = category;
        if (assignedGroup) dbQuery.assignedGroups = { $in: [assignedGroup] };
        if (visibility) dbQuery.isPublic = visibility === "public";
        if (status) dbQuery.isActive = status === "active";

        // Only show concluded AND public votes to non-committee members
        if (!user || !user.isCommitteeOrAdmin) {
            dbQuery.isActive = false;
            dbQuery.isPublic = true;
        }

        // Handle needs attention filter for committee members
        if (showNeedsAttention === "true" && user && user.isCommittee) {
            dbQuery.isActive = true;
            // First find votings where user is in assigned groups
            dbQuery.$or = [
                { assignedGroups: "tc", $expr: { $eq: [user.isTournamentCommittee, true] } },
                { assignedGroups: "cc", $expr: { $eq: [user.isContestCommittee, true] } },
            ];
        }

        const page = Number((utils.isString(req.query.page) ? req.query.page : undefined) || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        // Get total count before pagination
        const total = await Voting.countDocuments(dbQuery);

        let votings = await Voting.find(dbQuery)
            .skip(skip)
            .limit(DEFAULT_LIMIT)
            .sort({ createdAt: -1 })
            .populate(DEFAULT_POPULATE);

        // Filter out votings where user has already voted if needs attention is true
        if (showNeedsAttention === "true" && user && user.isCommittee) {
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
            targetUserIds,
            targetTournamentName,
            targetTournamentLink,
            type,
            allowNeutralVotes,
            forceFullParticipation,
            binaryStrictPassThreshold,
            isSanctionVote,
            sanctionType,
            sanctionPost,
        } = req.body;
        const files = req.files;

        const author = res.locals!.user!;

        const forceFullParticipationBool = forceFullParticipation === true || forceFullParticipation === "true";
        const isSanctionVoteBool = isSanctionVote === true || isSanctionVote === "true";

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
            allowNeutralVotes: neutralVotesSettingOverride,
            binaryStrictPassThreshold: type === "binary-strict" ? binaryStrictPassThreshold : undefined,
            forceFullParticipation: forceFullParticipationBool,
            isSanctionVote: isSanctionVoteBool,
        });

        if (isSanctionVoteBool) {
            if (category !== "user") {
                return res.status(400).json({ error: "Sanction votes must have category user" });
            }
            const parsedSanctionType = utils.pickStringUnion(String(sanctionType || ""), SANCTION_BAN_TYPES);
            const trimmedPost = utils.isString(sanctionPost) ? sanctionPost.trim() : "";
            const optionList = Array.isArray(options) ? options : [options];
            if (!parsedSanctionType) {
                return res.status(400).json({ error: "Sanction type is required" });
            }
            if (!trimmedPost || trimmedPost.length > 1000) {
                return res.status(400).json({ error: "Sanction post must be between 1 and 1000 characters" });
            }
            if (!areSanctionVoteOptions(optionList)) {
                return res.status(400).json({ error: "Sanction votes must use the tournament ban options" });
            }
            voting.sanctionType = parsedSanctionType;
            voting.sanctionPost = trimmedPost;
        }

        if (category === "user") {
            const targetUserIdArray = Array.isArray(targetUserIds)
                ? targetUserIds.map(String)
                : targetUserIds
                  ? [String(targetUserIds)]
                  : [];
            if (targetUserIdArray.length === 0) {
                return res.status(400).json({ error: "At least one target user is required" });
            }

            const loaded = await loadUsersByIds(targetUserIdArray);
            if ("error" in loaded) {
                return res.status(400).json({ error: loaded.error });
            }
            voting.targetUsers = loaded.users;
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
                author.id,
            );
        }

        const { requiredVotes } = await VotingService.computeRequiredVotes(voting);
        voting.requiredVotes = requiredVotes;

        await voting.save();

        res.json({
            message: "Vote created successfully!",
            voting,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            "voting",
        );

        // Discord
        const roles: DiscordRoleName[] = [];

        if (voting.assignedGroups.includes("tc")) roles.push("tournament");
        if (voting.assignedGroups.includes("cc")) roles.push("contest");

        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `Created a new **${voting.category}** vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
            )
            .setColor(DiscordUtils.webhookColors.lightYellow)
            .setFooter(`ID: ${voting._id}`)
            .addField(
                "Deadline",
                `${utils.discordTimestamp(voting.deadline)} (${utils.discordTimestamp(voting.deadline, "dateTime")})`,
            );

        if (voting.targetUsers?.length) {
            embed.addField(
                voting.targetUsers.length === 1 ? "Target User" : "Target Users",
                utils.formatHostsList(voting.targetUsers, { mdLinks: true }),
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
                if (!utils.isNumber(data.option) || data.option >= voting.options.length) {
                    return res.status(400).json({ error: "Invalid option index" });
                }
                break;
            case "binary":
                if (!utils.isNumber(data.score) || data.score < -5 || data.score > 5) {
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
                            utils.isNumber(s.optionIndex) &&
                            s.optionIndex < voting.options.length &&
                            utils.isNumber(s.score) &&
                            s.score >= -5 &&
                            s.score <= 5,
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
                if (!utils.isNumber(data.score) || data.score < -1 || data.score > 1) {
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
                            utils.isNumber(s.optionIndex) &&
                            s.optionIndex < voting.options.length &&
                            utils.isNumber(s.score) &&
                            s.score >= -2 &&
                            s.score <= 2,
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
                "voting",
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

        if (
            !voting.isActive &&
            voting.isSanctionVote &&
            (voting.sanctionAppliedAt || voting.sanctionInfringementIds?.length)
        ) {
            return res.status(400).json({
                error: "Cannot reopen a sanction vote after a watchlist entry has been created",
            });
        }

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
            "voting",
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
            targetUserIds,
            targetTournamentName,
            targetTournamentLink,
            sanctionType,
            sanctionPost,
        } = req.body;

        const voting = await Voting.findById(votingId).orFail();
        const targetUserIdArray = Array.isArray(targetUserIds)
            ? targetUserIds.map(String)
            : targetUserIds
              ? [String(targetUserIds)]
              : [];

        if (voting.isSanctionVote && category && category !== "user") {
            return res.status(400).json({ error: "Sanction votes must keep category user" });
        }

        if (voting.isSanctionVote && !voting.isActive && targetUserIdArray.length > 0) {
            const currentTargetIds = (voting.targetUsers ?? []).map((user) => (user._id ?? user).toString()).sort();
            const nextTargetIds = [...targetUserIdArray].sort();
            if (
                currentTargetIds.length > 0 &&
                (currentTargetIds.length !== nextTargetIds.length ||
                    currentTargetIds.some((id, index) => id !== nextTargetIds[index]))
            ) {
                return res.status(400).json({ error: "Cannot change the target users of a sanction vote" });
            }
        }

        if (voting.isSanctionVote && !voting.sanctionAppliedAt) {
            let sanctionFieldsChanged = false;
            if (sanctionType) {
                const parsedSanctionType = utils.pickStringUnion(String(sanctionType), SANCTION_BAN_TYPES);
                if (!parsedSanctionType) {
                    return res.status(400).json({ error: "Invalid sanction type" });
                }
                if (voting.sanctionType !== parsedSanctionType) {
                    voting.sanctionType = parsedSanctionType;
                    sanctionFieldsChanged = true;
                }
            }
            if (sanctionPost !== undefined) {
                const trimmedPost = utils.isString(sanctionPost) ? sanctionPost.trim() : "";
                if (!trimmedPost || trimmedPost.length > 1000) {
                    return res.status(400).json({ error: "Sanction post must be between 1 and 1000 characters" });
                }
                if (voting.sanctionPost !== trimmedPost) {
                    voting.sanctionPost = trimmedPost;
                    sanctionFieldsChanged = true;
                }
            }
            if (sanctionFieldsChanged && voting.sanctionInfringementIds?.length) {
                voting.sanctionAnnouncementChannelId = undefined;
                voting.sanctionAnnouncementSentCount = undefined;
            }
        }

        if (!voting.isActive) {
            if (category) {
                voting.category = category;

                if (category === "user" && targetUserIdArray.length > 0) {
                    const loaded = await loadUsersByIds(targetUserIdArray);
                    if ("error" in loaded) {
                        return res.status(400).json({ error: loaded.error });
                    }
                    voting.targetUsers = loaded.users;
                    voting.targetTournamentName = undefined;
                    voting.targetTournamentLink = undefined;
                } else if (category === "tournament" && targetTournamentName && targetTournamentLink) {
                    voting.targetTournamentName = targetTournamentName;
                    voting.targetTournamentLink = targetTournamentLink;
                    voting.targetUsers = [];
                } else if (category === "discussion") {
                    voting.targetUsers = [];
                    voting.targetTournamentName = undefined;
                    voting.targetTournamentLink = undefined;
                }
            }
        } else if (voting.isSanctionVote && targetUserIdArray.length > 0) {
            const loaded = await loadUsersByIds(targetUserIdArray);
            if ("error" in loaded) {
                return res.status(400).json({ error: loaded.error });
            }
            voting.targetUsers = loaded.users;
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
            "voting",
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
            "voting",
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(`Deleted a vote: [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`)
                    .setColor(DiscordUtils.webhookColors.darkRed),
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
            "voting",
        );

        // Discord
        const embed = new EmbedBuilder()
            .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
            .setDescription(
                `Made vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) ${
                    voting.isPublic ? "available for **public** viewing" : "private"
                }`,
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
            "voting",
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(
                        `Cleared all votes from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})`,
                    )
                    .setColor(DiscordUtils.webhookColors.red),
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
            isAbstained = false;
        } else {
            if (!VotingService.isEligibleVoter(user, voting.assignedGroups)) {
                return res.status(400).json({
                    error: "Only active voters in the assigned group(s) can abstain from this vote!",
                });
            }

            // user is not abstained, add them
            voting.abstainedUsers.push(user);
            isAbstained = true;
        }

        const computation = await VotingService.computeRequiredVotes(voting);

        if (isAbstained && computation.unclamped < 1) {
            return res.status(400).json({
                error: "Cannot abstain: would result in no required votes!",
            });
        }

        voting.requiredVotes = computation.requiredVotes;
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
            "voting",
        );

        // Discord
        await new WebhookBuilder()
            .addEmbed(
                new EmbedBuilder()
                    .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                    .setDescription(
                        `${isAbstained ? "Abstained" : "Removed abstention"} from vote: [**${voting.title}**](${
                            config.baseUrl
                        }/votes/${voting._id})`,
                    )
                    .setColor(isAbstained ? DiscordUtils.webhookColors.darkGray : DiscordUtils.webhookColors.white)
                    .setFooter(`Required votes: ${originalRequiredVotes} → ${voting.requiredVotes}`),
            )
            .send();
    }

    /** PATCH recalibrate required votes from the current active-voter roster */
    public async recalibrateRequiredVotes(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        if (!voting.isActive) {
            return res.status(400).json({ error: "Cannot recalibrate concluded votes!" });
        }

        const result = await VotingService.recalibrateRequiredVotes(voting);

        res.json({
            message: result.changed ? `Required votes: ${result.previous} → ${result.next}` : "Already up to date",
            voting,
        });

        if (!result.changed) return;

        await LogService.generate(
            req.session.mongoId!,
            `Recalibrated required votes for [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) from **${result.previous}** to **${result.next}**`,
            "voting",
        );

        await new WebhookBuilder()
            .addEmbed(
                VotingService.buildRecalibrationEmbed([{ voting, result }]).setAuthor(
                    DiscordUtils.defaultWebhookAuthor(req.session),
                ),
            )
            .send();
    }

    /** POST apply a concluded sanction vote */
    public async applySanction(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const currentUser = res.locals!.user!;
        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        try {
            const result = await VotingService.applySanction(voting, currentUser);
            const populated = await Voting.findById(voting.id).populate(DEFAULT_POPULATE).orFail();

            res.json({
                message: "Sanction applied successfully!",
                voting: populated,
            });

            const targetUsersLabel = formatWatchlistUserLinks(populated.targetUsers);
            const typeLabel = startCase(result.infringementType);
            await LogService.generate(
                req.session.mongoId!,
                `Applied **${typeLabel}** from vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${targetUsersLabel}`,
                "voting",
            );

            const isTimeBased = TIME_BASED_TYPES.includes(result.infringementType);
            const embed = new EmbedBuilder()
                .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                .setColor(result.isWarning ? DiscordUtils.webhookColors.yellow : DiscordUtils.webhookColors.red)
                .setDescription(
                    `Applied **${typeLabel}** from [**${voting.title}**](${config.baseUrl}/votes/${voting._id}) to ${targetUsersLabel}`,
                )
                .addField("Outcome", result.winnerOption);

            if (isTimeBased && result.phrase) {
                embed.addField("Duration", startCase(result.phrase));
            }
            if (voting.sanctionPost) {
                embed.addField("Reason", utils.shorten(voting.sanctionPost, 1024));
            }

            await new WebhookBuilder().addEmbed(embed).send();
        } catch (error: any) {
            if (error?.status && error?.error) {
                return res.status(error.status).json({ error: error.error });
            }
            throw error;
        }
    }

    /** POST undo an applied sanction vote */
    public async undoSanction(req: Request, res: Response) {
        const votingId = req.params.votingId;
        const voting = await Voting.findById(votingId).populate(DEFAULT_POPULATE).orFail();

        try {
            await VotingService.undoSanction(voting);
            const populated = await Voting.findById(voting.id).populate(DEFAULT_POPULATE).orFail();

            res.json({
                message: "Sanction undone successfully!",
                voting: populated,
            });

            const targetUsersLabel = formatWatchlistUserLinks(populated.targetUsers);
            await LogService.generate(
                req.session.mongoId!,
                `Undid sanction from vote [**${voting.title}**](${config.baseUrl}/votes/${voting._id})${
                    targetUsersLabel ? ` for ${targetUsersLabel}` : ""
                }`,
                "voting",
            );

            await new WebhookBuilder()
                .addEmbed(
                    new EmbedBuilder()
                        .setAuthor(DiscordUtils.defaultWebhookAuthor(req.session))
                        .setColor(DiscordUtils.webhookColors.orange)
                        .setDescription(
                            `Undid sanction from [**${voting.title}**](${config.baseUrl}/votes/${voting._id})${
                                targetUsersLabel ? ` for ${targetUsersLabel}` : ""
                            }`,
                        ),
                )
                .send();
        } catch (error: any) {
            if (error?.status && error?.error) {
                return res.status(error.status).json({ error: error.error });
            }
            throw error;
        }
    }
}

async function loadUsersByIds(ids: string[]) {
    const unordered = await User.find({ _id: { $in: ids } });
    if (unordered.length !== ids.length) {
        return { error: "One or more target user IDs are invalid" };
    }

    const users = ids
        .map((id) => unordered.find((user) => user._id.toString() === id))
        .filter((user): user is NonNullable<typeof user> => user !== undefined);

    return { users };
}

function formatWatchlistUserLinks(users: { username: string; osuId: number }[] | undefined): string {
    if (!users?.length) return "";
    return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
        users.map((user) => `[**${user.username}**](${config.baseUrl}/watchlist?user=${user.osuId})`),
    );
}

export default new VotingsController();
