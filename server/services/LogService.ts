import { LogCategory } from "../../interfaces/Log";
import Log from "../models/logModel";

class LogService {
    /**
     * Create a log for a user action
     * @param user Action user
     * @param action Action
     * @param category Log category
     */
    public async generate(user: string, action: string, category: LogCategory): Promise<void> {
        const log = new Log({ user, action, category });
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
