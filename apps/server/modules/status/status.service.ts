import { Injectable } from "@nestjs/common";
import { StatusInfo } from "@tc/types/Status";
import { VersionInfo } from "@tc/types/Version";
import VersionService from "../../services/VersionService";
import OsuApiHealthService from "@tc/osu/OsuApiHealthService";

@Injectable()
export class StatusService {
    getStatus(): StatusInfo {
        return {
            version: this.buildVersionInfo(),
            osuApi: OsuApiHealthService.getStatus(),
        };
    }

    private buildVersionInfo(): VersionInfo {
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
}
