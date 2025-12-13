/**
 * API Response Types - Frontend
 * 
 * Cấu trúc response chuẩn từ backend:
 * {
 *   success: boolean,
 *   message: string,
 *   data: T | null,
 *   error?: { code: string, details?: any },
 *   meta?: { page, limit, total, totalPages }
 * }
 */

// Error codes từ backend
export type ErrorCode = 
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'CONFLICT'
    | 'INTERNAL_ERROR'
    | 'BAD_REQUEST'
    | 'INVALID_TOKEN'
    | 'EXPIRED_TOKEN';

// Response interface
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
    error?: {
        code: ErrorCode | string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

// Success response type
export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
    success: true;
    data: T;
}

// Error response type
export interface ApiErrorResponse extends ApiResponse<null> {
    success: false;
    data: null;
    error: {
        code: ErrorCode | string;
        details?: any;
    };
}

// Helper function để check success
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> => {
    return response.success === true && response.data !== null;
};

// Helper function để check error
export const isApiError = (response: ApiResponse): response is ApiErrorResponse => {
    return response.success === false;
};

// Helper để extract data hoặc throw error
export const extractData = <T>(response: ApiResponse<T>): T => {
    if (isApiSuccess(response)) {
        return response.data;
    }
    throw new Error(response.message || 'API Error');
};

// Helper để xử lý response an toàn
export const handleApiResponse = <T>(
    response: ApiResponse<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: ApiErrorResponse) => void
): T | null => {
    if (isApiSuccess(response)) {
        onSuccess?.(response.data);
        return response.data;
    } else {
        onError?.(response as ApiErrorResponse);
        return null;
    }
};
