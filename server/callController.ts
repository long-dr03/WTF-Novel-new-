import { connectDB } from './db';
import type { ShimRequest } from './types';

type Controller = (req: any, res: any) => any | Promise<any>;

/**
 * Gọi TRỰC TIẾP một controller (kiểu Express-shim) ở phía server mà KHÔNG đi qua HTTP.
 * Dùng cho Server Component (vd. trang chủ SSR/ISR) để lấy dữ liệu công khai.
 */
export async function callController(
    controller: Controller,
    opts: { query?: Record<string, any>; params?: Record<string, any> } = {}
): Promise<any> {
    try {
        const db = await connectDB();
        if (!db) {
            return { success: false, message: "DB not connected", data: null };
        }
    } catch (e) {
        console.error("connectDB error in callController:", e);
        return { success: false, message: "DB error", data: null };
    }

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

    try {
        await controller(req as any, res);
    } catch (err) {
        console.error("Controller execution error in callController:", err);
        return { success: false, message: "Controller error", data: null };
    }

    return captured;
}
