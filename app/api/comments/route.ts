import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getComments, createComment } from '@/server/controllers/comment.controller';

export async function GET(req: NextRequest) {
    return handle(req, getComments);
}

export async function POST(req: NextRequest) {
    return handle(req, createComment, { auth: true });
}
