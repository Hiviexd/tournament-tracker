import { Request, Response } from "express";
import { VersionInfo } from "../../interfaces/Version";
import VersionService from "../services/VersionService";

class VersionController {
    public getVersion(_: Request, res: Response<VersionInfo>) {
        const versionData: VersionInfo = {
            hash: VersionService.getGitHash(),
            message: VersionService.getGitMessage(),
        };

        // Only include branch status on preview instances
        if (process.env.NODE_ENV === "preview") {
            const branchStatus = VersionService.getBranchStatus();
            if (branchStatus) {
                versionData.branchStatus = branchStatus;
            }
        }

        res.json(versionData);
    }
}

export default new VersionController();
