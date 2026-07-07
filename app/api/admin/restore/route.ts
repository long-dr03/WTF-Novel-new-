import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { restoreData } from '@/server/controllers/adminController';

export const POST = (req: NextRequest) => handle(req, restoreData, { admin: true });
