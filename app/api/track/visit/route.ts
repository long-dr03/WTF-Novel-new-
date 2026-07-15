import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { trackVisit } from '@/server/controllers/tracking.controller';

// Không bắt buộc đăng nhập: handle vẫn giải mã token nếu có để lấy req.userId.
// Khách vãng lai sẽ được bỏ qua trong controller.
export const POST = (req: NextRequest) => handle(req, trackVisit);
