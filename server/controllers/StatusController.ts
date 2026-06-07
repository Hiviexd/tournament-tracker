import { Request, Response } from "express";
import { StatusInfo } from "../../interfaces/Status";
import VersionService from "../services/VersionService";
import OsuApiHealthService from "../services/OsuApiHealthService";

class StatusController {
    public getStatus(_: Request, res: Response) {
        const statusData: StatusInfo = {
            version: {
                hash: VersionService.getGitHash(),
                message: VersionService.getGitMessage(),
            },
            osuApi: OsuApiHealthService.getStatus(),
        };

        if (process.env.NODE_ENV === "preview") {
            const branchStatus = VersionService.getBranchStatus();
            if (branchStatus) {
                statusData.version.branchStatus = branchStatus;
            }
        }

        res.json(statusData);
    }
}

export default new StatusController();
