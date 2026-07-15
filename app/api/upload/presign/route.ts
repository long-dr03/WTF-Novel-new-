import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { presignMedia } from '@/server/controllers/upload.controller';

// Cần đăng nhập. Trả về { uploadUrl, publicUrl, key, contentType } cho ảnh/video.
export const POST = (req: NextRequest) => handle(req, presignMedia, { auth: true });
