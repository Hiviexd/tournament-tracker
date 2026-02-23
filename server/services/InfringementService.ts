import { Types } from "mongoose";
import moment from "moment";
import Infringement from "../models/infringementModel";
import User from "../models/userModel";
import { IInfringement, InfringementType, TIME_BASED_TYPES, WatchlistQuery } from "../../interfaces/Infringement";
import utils from "../../utils";

class InfringementService {
    public async addInfringement(
        userId: string,
        data: {
            type: InfringementType;
            startDate?: string | Date;
            endDate?: string | Date;
            reason: string;
            threadId?: string;
            enchantUrl?: string;
        }
    ) {
        const { type, startDate, endDate, reason, threadId, enchantUrl } = data;

        if (!Object.values(InfringementType).includes(type)) {
            throw { status: 400, error: "Invalid infringement type" };
        }

        const isTimeBased = TIME_BASED_TYPES.includes(type);

        if (isTimeBased) {
            if (startDate && !moment(startDate).isValid()) {
                throw { status: 400, error: "Invalid start date format" };
            }

            if (endDate) {
                if (!moment(endDate).isValid()) {
                    throw { status: 400, error: "Invalid end date format" };
                }

                if (startDate && moment(endDate).isBefore(moment(startDate))) {
                    throw { status: 400, error: "End date must be after start date" };
                }
            }
        }

        if (!reason || typeof reason !== "string" || reason?.trim() === "") {
            throw { status: 400, error: "Reason is required and must be a non-empty string" };
        }

        if ((!threadId || typeof threadId !== "string") || threadId?.trim() === "") {
            throw { status: 400, error: "Thread ID must be a non-empty string" };
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            throw { status: 400, error: "Invalid Enchant ticket URL format" };
        }

        const extractedThreadId = utils.extractDiscordThreadId(threadId) || undefined;

        const user = await User.findById(userId).orFail();

        // Auto-expire active time-based infringement when adding a new time-based one
        if (isTimeBased) {
            const activeInfringement = await (Infringement as any).findActiveForUser(userId);
            if (activeInfringement) {
                activeInfringement.endDate = new Date();
                await activeInfringement.save();
            }
        }

        const infringementData: Partial<IInfringement> = {
            userId: user._id,
            type,
            reason,
            threadId: extractedThreadId,
            enchantUrl,
        };

        if (isTimeBased) {
            infringementData.startDate = startDate ? new Date(startDate as string) : new Date();
            if (endDate) {
                infringementData.endDate = new Date(endDate as string);
            }
        }

        const infringement = await Infringement.create(infringementData);

        const userWithInfringements = await User.findById(userId).populate("infringements").orFail();
        return { infringement, user: userWithInfringements };
    }

    public async updateInfringement(
        infringementId: string,
        userId: string,
        data: {
            startDate?: string | Date;
            endDate?: string | Date | null;
            reason?: string;
            threadId?: string;
            enchantUrl?: string;
        }
    ) {
        const { startDate, endDate, reason, threadId, enchantUrl } = data;

        if (reason && (typeof reason !== "string" || reason?.trim() === "")) {
            throw { status: 400, error: "Reason must be a non-empty string" };
        }

        if (threadId && (typeof threadId !== "string" || threadId?.trim() === "")) {
            throw { status: 400, error: "Thread ID must be a non-empty string" };
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            throw { status: 400, error: "Invalid Enchant ticket URL format" };
        }

        const infringement = await Infringement.findById(infringementId);

        if (!infringement || infringement.userId.toString() !== userId) {
            throw { status: 404, error: "Infringement not found" };
        }

        const isTimeBased = TIME_BASED_TYPES.includes(infringement.type);

        if (isTimeBased) {
            if (startDate && !moment(startDate).isValid()) {
                throw { status: 400, error: "Invalid start date format" };
            }

            if (endDate) {
                if (!moment(endDate).isValid()) {
                    throw { status: 400, error: "Invalid end date format" };
                }

                if (startDate && moment(endDate).isBefore(moment(startDate))) {
                    throw { status: 400, error: "End date must be after start date" };
                }
            }
        }

        if (isTimeBased) {
            if (startDate !== undefined) {
                infringement.startDate = startDate ? new Date(startDate as string) : undefined;
            }
            if (endDate !== undefined) {
                infringement.endDate = endDate ? new Date(endDate as string) : undefined;
            }
        }

        if (reason !== undefined) {
            infringement.reason = reason;
        }
        if (threadId !== undefined) {
            infringement.threadId = utils.extractDiscordThreadId(threadId) || undefined;
        }
        if (enchantUrl !== undefined) {
            infringement.enchantUrl = enchantUrl;
        }

        await infringement.save();

        const user = await User.findById(userId).populate("infringements").orFail();

        return { infringement, user };
    }

    public async getWatchlist(query: WatchlistQuery) {
        const infringementFilter: any = {};

        if (query.infringementType) {
            infringementFilter.type = query.infringementType;
        }

        const userFilter: any = {};

        if (query.userInput) {
            const userInput = utils.escapeUsername(query.userInput);
            if (utils.isNumeric(userInput)) {
                userFilter.osuId = parseInt(userInput, 10);
            } else {
                userFilter.username = { $regex: userInput, $options: "i" };
            }
        }

        // If there's a user filter, find matching users first to intersect
        let targetUserIds: Types.ObjectId[] | undefined;
        if (Object.keys(userFilter).length > 0) {
            const matchingUsers = await User.find(userFilter).select("_id");
            targetUserIds = matchingUsers.map((u) => u._id);
            if (targetUserIds.length === 0) return [];
            infringementFilter.userId = { $in: targetUserIds };
        }

        const userIdsWithInfringements = await Infringement.distinct("userId", infringementFilter);

        if (userIdsWithInfringements.length === 0) return [];

        const users = await User.find({ _id: { $in: userIdsWithInfringements } })
            .populate("infringements")
            .sort({ updatedAt: -1 });

        return users;
    }

    public async getInfringementsNeedingEmail() {
        const userIds = await Infringement.distinct("userId", {
            type: {
                $in: [
                    InfringementType.HOSTING_BAN,
                    InfringementType.STAFFING_BAN,
                    InfringementType.TOURNAMENT_BAN,
                    InfringementType.WARNING,
                ],
            },
            enchantUrl: { $exists: false },
        });

        if (userIds.length === 0) return [];

        const users = await User.find({ _id: { $in: userIds } }).populate({
            path: "infringements",
            match: {
                type: { $ne: InfringementType.NOTE },
                enchantUrl: { $exists: false },
            },
        });

        return users.filter((u) => u.infringements && u.infringements.length > 0);
    }

    public async findActiveForUser(userId: string | Types.ObjectId): Promise<IInfringement | null> {
        return await Infringement.findActiveForUser(userId);
    }
}

export default new InfringementService();
