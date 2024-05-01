export interface SuccessResponse {
    success: string;
}

export interface ErrorResponse {
    error: string;
}

export type BasicResponse = SuccessResponse | ErrorResponse;
