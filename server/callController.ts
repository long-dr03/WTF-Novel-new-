import { connectDB } from './db';
import type { ShimRequest } from './types';

type Controller = (req: any, res: any) => any | Promise<any>;

/**
 * Gọi TRỰC TIẾP một controller (kiểu Express-shim) ở phía server mà KHÔNG đi qua HTTP.
 *
 * Dùng cho Server Component (vd. trang chủ SSR/ISR) để lấy dữ liệu công khai:
 * tránh việc Next server tự gọi API của chính nó qua localhost — vốn dễ lỗi
 * ECONNREFUSED lúc khởi động/rebuild và chậm hơn vì thêm 1 vòng HTTP.
 *
 * @returns payload mà controller trả về (thường là { success, message, data }).
 */
export async function callController(
    controller: Controller,
    opts: { query?: Record<string, any>; params?: Record<string, any> } = {}
): Promise<any> {
    await connectDB();

    const req: Partial<ShimRequest> = {
        query: opts.query || {},
        params: opts.params || {},
        body: {},
        headers: {},
        cookies: {},
    };

    let captured: any;
    const res: any = {
        statusCode: 200,
        status(code: number) { this.statusCode = code; return this; },
        json(payload: any) { captured = payload; return this; },
        send(payload: any) { captured = payload; return this; },
        setHeader() { return this; },
    };

    await controller(req as any, res);
    return captured;
}
