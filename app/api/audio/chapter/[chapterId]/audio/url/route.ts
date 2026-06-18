import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateChapterAudioUrl } from '@/server/controllers/tts.controller';

type Ctx = { params: Promise<{ chapterId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
    const { chapterId } = await ctx.params;
    return handle(req, updateChapterAudioUrl, { params: { chapterId }, auth: true });
}
