import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { uploadChapterAudio } from '@/server/controllers/tts.controller';

type Ctx = { params: Promise<{ chapterId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
    const { chapterId } = await ctx.params;
    return handle(req, uploadChapterAudio, { params: { chapterId }, auth: true });
}
