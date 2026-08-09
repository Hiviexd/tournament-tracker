import { Injectable } from "@nestjs/common";
import Log from "@tc/models/logModel";
import User from "@tc/models/userModel";
import { LogQueryParams, LogListQuery } from "@tc/types/Log";
import utils from "@tc/utils/server";

const DEFAULT_POPULATE = [
    {
        path: "user",
        select: "username osuId groups coverUrl country",
    },
];

const DEFAULT_LIMIT = 20;

@Injectable()
export class LogsService {
    async index(reqQuery: LogListQuery) {
        const dbQuery: LogQueryParams = {};

        if (reqQuery.user && reqQuery.user.length) {
            const userDoc = await User.findByUsernameOrOsuId(reqQuery.user);
            dbQuery.user = userDoc || undefined;
            dbQuery.isSystemLog = false;
        }
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.type === "system") dbQuery.isSystemLog = true;
        if (reqQuery.type === "user") dbQuery.isSystemLog = false;
        if (reqQuery.content) dbQuery.action = { $regex: utils.escapeRegexPattern(reqQuery.content), $options: "i" };

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        const [logs, total] = await Promise.all([
            Log.find(dbQuery).skip(skip).limit(DEFAULT_LIMIT).sort({ createdAt: -1 }).populate(DEFAULT_POPULATE),
            Log.countDocuments(dbQuery),
        ]);

        return {
            logs,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        };
    }

    async exportCsv(): Promise<string> {
        const logs = await Log.find({}).sort({ createdAt: -1 }).populate(DEFAULT_POPULATE);

        const csvData = logs.map((log) => ({
            timestamp: log.createdAt.toISOString(),
            username: log.user?.username || "System",
            osuId: log.user?.osuId || "NULL",
            category: log.category,
            action: log.action,
        }));

        const headers = ["timestamp", "username", "osuId", "category", "action"];
        const csvRows = [headers.join(",")];

        csvData.forEach((row) => {
            const values = headers.map((header) => {
                const value = row[header as keyof typeof row];
                const escapedValue = String(value).replace(/"/g, '""');
                return `"${escapedValue}"`;
            });
            csvRows.push(values.join(","));
        });

        return csvRows.join("\n");
    }
}
