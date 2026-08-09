import { Request, Response } from "express";
import { StatusInfo } from "@tc/types/Status";
import { VersionInfo } from "@tc/types/Version";
import VersionService from "../services/VersionService";
import OsuApiHealthService from "../services/OsuApiHealthService";

function buildVersionInfo(): VersionInfo {
    const versionData: VersionInfo = {
        hash: VersionService.getGitHash(),
        message: VersionService.getGitMessage(),
    };

    if (process.env.NODE_ENV === "preview") {
        const branchStatus = VersionService.getBranchStatus();
        if (branchStatus) {
            versionData.branchStatus = branchStatus;
        }
    }

    return versionData;
}

class StatusController {
    public getStatus(_: Request, res: Response) {
        const statusData: StatusInfo = {
            version: buildVersionInfo(),
            osuApi: OsuApiHealthService.getStatus(),
        };

        res.json(statusData);
    }
}

export default new StatusController();
