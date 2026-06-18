import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateNovelStatus } from '@/server/controllers/uploadNovel';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, updateNovelStatus, { params: { novelId: id } });
}
