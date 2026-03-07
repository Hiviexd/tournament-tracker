import Log from "../models/logModel";
import User from "../models/userModel";
import { LogQueryParams, LogListQuery } from "../../interfaces/Log";
import { Request, Response } from "express";
import utils from "../../utils";

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
        const reqQuery = req.query as LogListQuery;
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

        const csv = csvRows.join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=logs-export.csv");
        res.send(csv);
    }
}

export default new LogsController();
