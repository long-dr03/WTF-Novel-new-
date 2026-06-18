import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateReportStatus } from '@/server/controllers/report.controller';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, updateReportStatus, { params: { id }, admin: true });
}
