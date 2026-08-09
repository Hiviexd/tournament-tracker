import { VersionInfo } from "./Version";

export type OsuApiHealthStatus = "healthy" | "down";

export interface OsuApiStatus {
    status: OsuApiHealthStatus;
    since: string | null;
}

export interface StatusInfo {
    version: VersionInfo;
    osuApi: OsuApiStatus;
}
