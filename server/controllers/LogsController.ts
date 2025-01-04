import Log from "../models/logModel";
import User from "../models/userModel";
import { LogQueryParams } from "../../interfaces/Log";

const DEFAULT_POPULATE = [
    {
        path: "user",
        select: "username osuId",
    },
];

const DEFAULT_LIMIT = 20;

class LogsController {
    /** GET logs listing */
    public async index(req, res) {
        const { user, category, type, page = 1 } = req.query;
        const query: LogQueryParams = {};

        if (user && user.length) {
            const userDoc = await User.findByUsernameOrOsuId(user);
            query.user = userDoc || null;
            query.isSystemLog = false;
        }
        if (category) query.category = category;
        if (type === "system") query.isSystemLog = true;
        if (type === "user") query.isSystemLog = false;

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const [logs, total] = await Promise.all([
            Log.find(query)
                .skip(skip)
                .limit(DEFAULT_LIMIT)
                .sort({ createdAt: -1 })
                .populate(DEFAULT_POPULATE),
            Log.countDocuments(query),
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
