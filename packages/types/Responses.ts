export interface SuccessResponse {
    success: string;
}

export interface ErrorResponse {
    error: string;
    statusCode?: number;
    details?: unknown;
    source?: string;
}

export type BasicResponse = SuccessResponse | ErrorResponse;
