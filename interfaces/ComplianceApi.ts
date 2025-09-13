export interface IValidationResult {
    beatmapset_id: number;
    complianceStatus: ComplianceStatus;
    complianceStatusString?: string;
    complianceFailureReason?: ComplianceFailureReason;
    complianceFailureReasonString?: string;
    notes?: string;
    cover?: string;
    artist: string;
    title: string;
    owner_id?: number;
    owner_username?: string;
    status: string;
}

export interface IComplianceApiErrorResponse {
    statusCode: number;
    code: string;
    error: string;
    message: string;
}

export interface IComplianceApiSuccessResponse {
    results: IValidationResult[];
    failures: string[];
}

export type IComplianceApiResponse = IComplianceApiSuccessResponse | IComplianceApiErrorResponse;

export const ComplianceStatus = {
    OK: 0,
    POTENTIALLY_DISALLOWED: 1,
    DISALLOWED: 2,
} as const;

export type ComplianceStatus = (typeof ComplianceStatus)[keyof typeof ComplianceStatus];

export const ComplianceFailureReason = {
    DMCA: 0,
    DISALLOWED_ARTIST: 1,
    DISALLOWED_SOURCE: 2,
    DISALLOWED_BY_RIGHTSHOLDER: 3,
    FA_TRACKS_ONLY: 4,
} as const;

export type ComplianceFailureReason = (typeof ComplianceFailureReason)[keyof typeof ComplianceFailureReason];
