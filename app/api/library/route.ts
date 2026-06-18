import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getLibrary, addToLibrary } from '@/server/controllers/library.controller';

export const GET = (req: NextRequest) => handle(req, getLibrary, { auth: true });
export const POST = (req: NextRequest) => handle(req, addToLibrary, { auth: true });
