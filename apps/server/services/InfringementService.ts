import { Types } from "mongoose";
import dayjs from "@tc/utils/dayjs";
import Infringement from "../models/infringementModel";
import User from "../models/userModel";
import {
    IInfringement,
    InfringementType,
    TIME_BASED_TYPES,
    WatchlistQuery,
    WATCHLIST_DEFAULT_LIMIT,
} from "@tc/types/Infringement";
import { isFunction } from "@tc/utils/common";
import utils from "@tc/utils/server";

interface WatchlistInfringementFilter {
    type?: InfringementType;
}

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
        },
    ) {
        const { type, startDate, endDate, reason, threadId, enchantUrl } = data;

        if (!Object.values(InfringementType).includes(type)) {
            throw { status: 400, error: "Invalid infringement type" };
        }

        const isTimeBased = TIME_BASED_TYPES.includes(type);

        if (isTimeBased) {
            if (startDate && !dayjs(startDate).isValid()) {
                throw { status: 400, error: "Invalid start date format" };
            }

            if (endDate) {
                if (!dayjs(endDate).isValid()) {
                    throw { status: 400, error: "Invalid end date format" };
                }

                if (startDate && dayjs(endDate).isBefore(dayjs(startDate))) {
                    throw { status: 400, error: "End date must be after start date" };
                }
            }
        }

        if (!reason || reason.trim() === "") {
            throw { status: 400, error: "Reason is required and must be a non-empty string" };
        }

        if (threadId !== undefined && threadId.trim() === "") {
            throw { status: 400, error: "Thread ID must be a non-empty string" };
        }

        if (enchantUrl && !utils.isEnchantTicketLink(enchantUrl)) {
            throw { status: 400, error: "Invalid Enchant ticket URL format" };
        }

        const extractedThreadId = utils.extractDiscordThreadId(threadId ?? null) || undefined;

        const user = await User.findById(userId).orFail();

        // Auto-expire active time-based infringement when adding a new time-based one
        if (isTimeBased) {
            const activeInfringement = await Infringement.findActiveForUser(userId);
            if (activeInfringement && "save" in activeInfringement && isFunction(activeInfringement.save)) {
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
            infringementData.startDate = startDate ? new Date(startDate) : new Date();
            if (endDate) {
                infringementData.endDate = new Date(endDate);
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
        },
    ) {
        const { startDate, endDate, reason, threadId, enchantUrl } = data;

        if (reason && reason.trim() === "") {
            throw { status: 400, error: "Reason must be a non-empty string" };
        }

        if (threadId && threadId.trim() === "") {
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
            if (startDate && !dayjs(startDate).isValid()) {
                throw { status: 400, error: "Invalid start date format" };
            }

            if (endDate) {
                if (!dayjs(endDate).isValid()) {
                    throw { status: 400, error: "Invalid end date format" };
                }

                if (startDate && dayjs(endDate).isBefore(dayjs(startDate))) {
                    throw { status: 400, error: "End date must be after start date" };
                }
            }
        }

        if (isTimeBased) {
            if (startDate !== undefined) {
                infringement.startDate = startDate ? new Date(startDate) : undefined;
            }
            if (endDate !== undefined) {
                infringement.endDate = endDate ? new Date(endDate) : undefined;
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
        const infringementFilter: WatchlistInfringementFilter = {};

        if (query.infringementType) {
            infringementFilter.type = query.infringementType;
        }

        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? WATCHLIST_DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        const [facetResult] = await Infringement.aggregate<{
            total: { count: number }[];
            page: { _id: Types.ObjectId; latestInfringementAt: Date }[];
        }>([
            { $match: infringementFilter },
            { $group: { _id: "$userId", latestInfringementAt: { $max: "$createdAt" } } },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    page: [{ $sort: { latestInfringementAt: -1 } }, { $skip: skip }, { $limit: limit }],
                },
            },
        ]);

        const total = facetResult?.total[0]?.count ?? 0;

        if (total === 0) {
            return { users: [], total: 0, page: 1, pages: 0 };
        }

        const pages = Math.ceil(total / limit);
        const orderedIds = facetResult.page.map((row) => row._id);
        const usersUnordered = await User.find({ _id: { $in: orderedIds } }).populate("infringements");
        const orderIndex = new Map(orderedIds.map((id, i) => [id.toString(), i]));
        const users = usersUnordered.sort(
            (a, b) => (orderIndex.get(a._id.toString()) ?? 0) - (orderIndex.get(b._id.toString()) ?? 0),
        );

        return { users, total, page, pages };
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

    public async deleteInfringement(infringementId: string | Types.ObjectId) {
        return await Infringement.findByIdAndDelete(infringementId);
    }

    public async syncSanctionInfringement(
        infringementId: string | Types.ObjectId,
        userId: string,
        data: { type: InfringementType; reason: string },
    ) {
        const infringement = await Infringement.findById(infringementId);
        if (!infringement || infringement.userId.toString() !== userId) return null;

        const changed = infringement.type !== data.type || infringement.reason !== data.reason;
        if (!changed) return { infringement, changed: false };

        infringement.type = data.type;
        infringement.reason = data.reason;
        await infringement.save();
        return { infringement, changed: true };
    }
}

export default new InfringementService();
