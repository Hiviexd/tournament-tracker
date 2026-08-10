import { Injectable } from "@nestjs/common";
import { StatusInfo } from "@tc/types/Status";
import { VersionInfo } from "@tc/types/Version";
import { VersionService } from "../../services/VersionService";
import OsuApiHealthService from "@tc/osu/OsuApiHealthService";

@Injectable()
export class StatusService {
    constructor(private readonly versionService: VersionService) {}

    getStatus(): StatusInfo {
        return {
            version: this.buildVersionInfo(),
            osuApi: OsuApiHealthService.getStatus(),
        };
    }

    private buildVersionInfo(): VersionInfo {
        const versionData: VersionInfo = {
            hash: this.versionService.getGitHash(),
            message: this.versionService.getGitMessage(),
        };

        if (process.env.NODE_ENV === "preview") {
            const branchStatus = this.versionService.getBranchStatus();
            if (branchStatus) {
                versionData.branchStatus = branchStatus;
            }
        }

        return versionData;
    }
}
