import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { seedGenres } from '@/server/controllers/adminController';

export const POST = (req: NextRequest) => handle(req, seedGenres, { admin: true });
