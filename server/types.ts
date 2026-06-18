/**
 * Kiểu dữ liệu "shim" thay cho Express Request/Response.
 *
 * Các controller cũ được viết cho Express dùng (req, res). Khi gộp backend vào
 * Next.js, ta không chạy Express nữa mà dùng một lớp adapter (xem ./adapter.ts)
 * tạo ra object req/res giả lập tương thích để TÁI SỬ DỤNG nguyên controller.
 */

export interface ShimRequest {
    params: Record<string, any>;
    query: Record<string, any>;
    body: any;
    headers: Record<string, any>;
    file?: any;
    files?: any;
    user?: any;
    userId?: string;
    cookies?: Record<string, any>;
}

export interface ShimResponse {
    statusCode: number;
    status(code: number): ShimResponse;
    json(payload: any): ShimResponse;
    send(payload: any): ShimResponse;
    setHeader(key: string, value: string): ShimResponse;
    // Cho phép gán thuộc tính nội bộ (_json, _text, ...)
    [key: string]: any;
}

// Alias để các controller cũ chỉ cần đổi `from 'express'` -> `from '../types'`.
export type Request = ShimRequest;
export type Response = ShimResponse;
export type NextFunction = (err?: any) => void;
