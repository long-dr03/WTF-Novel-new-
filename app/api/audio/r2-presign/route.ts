import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { presignChapterAudio } from '@/server/controllers/upload.controller';

// Cần đăng nhập (author/admin đang quản lý audio). Trả về { uploadUrl, publicUrl, key, contentType }.
export const POST = (req: NextRequest) => handle(req, presignChapterAudio, { auth: true });
