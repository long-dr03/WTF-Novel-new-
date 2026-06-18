import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { toggleFeatured } from '@/server/controllers/adminController';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, toggleFeatured, { params: { id }, admin: true });
}
