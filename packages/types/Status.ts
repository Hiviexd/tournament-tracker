import { VersionInfo } from "./Version";

export type OsuApiHealthStatus = "healthy" | "down";
export type ServiceHealth = "healthy" | "degraded" | "unhealthy";

export interface OsuApiStatus {
    status: OsuApiHealthStatus;
    since: string | null;
}

export interface StatusInfo {
    status: ServiceHealth;
    version: VersionInfo;
    osuApi: OsuApiStatus;
}
