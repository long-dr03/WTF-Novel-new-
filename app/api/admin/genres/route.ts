import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getGenres, createGenre } from '@/server/controllers/adminController';

export const GET = (req: NextRequest) => handle(req, getGenres, { admin: true });
export const POST = (req: NextRequest) => handle(req, createGenre, { admin: true });
