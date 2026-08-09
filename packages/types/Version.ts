export interface VersionInfo {
    hash: string;
    message: string;
    branchStatus?: BranchStatus;
}

export interface BranchStatus {
    currentBranch: string;
    ahead: number;
    behind: number;
}
