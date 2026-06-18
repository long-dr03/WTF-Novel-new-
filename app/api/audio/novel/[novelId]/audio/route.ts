import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getNovelAudioList } from '@/server/controllers/tts.controller';

type Ctx = { params: Promise<{ novelId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { novelId } = await ctx.params;
    return handle(req, getNovelAudioList, { params: { novelId } });
}
