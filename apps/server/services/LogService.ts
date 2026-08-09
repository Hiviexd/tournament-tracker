import { LogCategory } from "@tc/types/Log";
import Log from "@tc/models/logModel";

class LogService {
    /**
     * Create a log for a user action
     * @param userId Mongo ID of action user
     * @param action Action
     * @param category Log category
     */
    public async generate(userId: string, action: string, category: LogCategory): Promise<void> {
        const log = new Log({ user: userId, action, category });
        await log.save();
    }

    /**
     * Create a log for a system action
     * @param action Action
     * @param category Log category
     */
    public async generateSystem(action: string, category: LogCategory): Promise<void> {
        const log = new Log({ action, category, isSystemLog: true });
        await log.save();
    }
}

export default new LogService();
