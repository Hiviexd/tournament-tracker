import Log from "../models/logModel";
import User from "../models/userModel";
import { LogQueryParams, LOG_CATEGORIES } from "@tc/types/Log";
import { Request, Response } from "express";
import utils from "@tc/utils/server";

const DEFAULT_POPULATE = [
    {
        path: "user",
        select: "username osuId groups coverUrl country",
    },
];

const DEFAULT_LIMIT = 20;

class LogsController {
    /** GET logs listing */
    public async index(req: Request, res: Response) {
        const user = utils.isString(req.query.user) ? req.query.user : undefined;
        const category = utils.isString(req.query.category)
            ? utils.pickStringUnion(req.query.category, LOG_CATEGORIES)
            : undefined;
        const type = utils.isString(req.query.type) ? req.query.type : undefined;
        const content = utils.isString(req.query.content) ? req.query.content : undefined;
        const dbQuery: LogQueryParams = {};

        if (user && user.length) {
            const userDoc = await User.findByUsernameOrOsuId(user);
            dbQuery.user = userDoc || undefined;
            dbQuery.isSystemLog = false;
        }
        if (category) dbQuery.category = category;
        if (type === "system") dbQuery.isSystemLog = true;
        if (type === "user") dbQuery.isSystemLog = false;
        if (content) dbQuery.action = { $regex: utils.escapeRegexPattern(content), $options: "i" };

        const page = Number((utils.isString(req.query.page) ? req.query.page : undefined) || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        const [logs, total] = await Promise.all([
            Log.find(dbQuery).skip(skip).limit(DEFAULT_LIMIT).sort({ createdAt: -1 }).populate(DEFAULT_POPULATE),
            Log.countDocuments(dbQuery),
        ]);

        res.json({
            logs,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }

    /** GET logs CSV export */
    public async exportCsv(req: Request, res: Response) {
        const logs = await Log.find({}).sort({ createdAt: -1 }).populate(DEFAULT_POPULATE);

        const csvData = logs.map((log) => ({
            timestamp: log.createdAt.toISOString(),
            username: log.user?.username || "System",
            osuId: log.user?.osuId || "NULL",
            category: log.category,
            action: log.action,
        }));

        const headers = ["timestamp", "username", "osuId", "category", "action"] as const;
        const csvRows = [headers.join(",")];

        csvData.forEach((row) => {
            const values = headers.map((header) => {
                const value = row[header];
                const escapedValue = String(value).replace(/"/g, '""');
                return `"${escapedValue}"`;
            });
            csvRows.push(values.join(","));
        });

        const csv = csvRows.join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=logs-export.csv");
        res.send(csv);
    }
}

export default new LogsController();
