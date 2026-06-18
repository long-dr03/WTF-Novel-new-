import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getChapterAudioInfo, deleteChapterAudio } from '@/server/controllers/tts.controller';

type Ctx = { params: Promise<{ chapterId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { chapterId } = await ctx.params;
    return handle(req, getChapterAudioInfo, { params: { chapterId } });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
    const { chapterId } = await ctx.params;
    return handle(req, deleteChapterAudio, { params: { chapterId }, auth: true });
}
