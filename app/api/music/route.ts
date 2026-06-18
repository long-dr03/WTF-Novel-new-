import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getMusicLibrary, uploadMusic } from '@/server/controllers/music.controller';

export const GET = (req: NextRequest) => handle(req, getMusicLibrary, { auth: true });
export const POST = (req: NextRequest) => handle(req, uploadMusic, { auth: true });
