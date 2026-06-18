import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getNovelById } from '@/server/controllers/getNovel';
import { updateNovel } from '@/server/controllers/uploadNovel';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, getNovelById, { params: { id } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, updateNovel, { params: { novelId: id } });
}
