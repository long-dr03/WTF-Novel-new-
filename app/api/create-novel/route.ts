import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { createNovel } from '@/server/controllers/uploadNovel';

export const POST = (req: NextRequest) => handle(req, createNovel);
