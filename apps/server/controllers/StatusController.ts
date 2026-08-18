import { Request, Response } from "express";
import mongoose from "mongoose";
import { OsuApiStatus, ServiceHealth, StatusInfo } from "@tc/types/Status";
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

function getServiceHealth(osuApi: OsuApiStatus): ServiceHealth {
    if (mongoose.connection.readyState !== 1) return "unhealthy";
    if (osuApi.status === "down") return "degraded";
    return "healthy";
}

class StatusController {
    public getStatus(_: Request, res: Response) {
        const osuApi = OsuApiHealthService.getStatus();
        const statusData: StatusInfo = {
            status: getServiceHealth(osuApi),
            version: buildVersionInfo(),
            osuApi,
        };

        res.json(statusData);
    }
}

export default new StatusController();
