import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { rejectNovel } from '@/server/controllers/adminController';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, rejectNovel, { params: { id }, admin: true });
}
