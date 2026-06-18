import type { ShimRequest } from '../types';

/**
 * Kiểu Request đã được xác thực (gắn user/userId).
 * Việc xác thực thực tế do adapter (../adapter.ts) thực hiện trước khi gọi
 * controller, nên ở đây chỉ cần khai báo kiểu để các controller cũ import lại.
 */
export interface AuthRequest extends ShimRequest {
    user?: any;
    userId?: string;
}
