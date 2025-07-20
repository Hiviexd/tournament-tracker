import Log from "../models/logModel";
import User from "../models/userModel";
import { LogQueryParams, LogListQuery } from "../../interfaces/Log";
import { Request, Response } from "express";

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
            dbQuery.user = userDoc || null;
            dbQuery.isSystemLog = false;
        }
        if (reqQuery.category) dbQuery.category = reqQuery.category;
        if (reqQuery.type === "system") dbQuery.isSystemLog = true;
        if (reqQuery.type === "user") dbQuery.isSystemLog = false;

        const page = Number(reqQuery.page || 1);
        const skip = (page - 1) * DEFAULT_LIMIT;

        const [logs, total] = await Promise.all([
            Log.find(dbQuery)
                .skip(skip)
                .limit(DEFAULT_LIMIT)
                .sort({ createdAt: -1 })
                .populate(DEFAULT_POPULATE),
            Log.countDocuments(dbQuery),
        ]);

        res.json({
            logs,
            total,
            page: Number(page),
            pages: Math.ceil(total / DEFAULT_LIMIT),
        });
    }
}

export default new LogsController();
