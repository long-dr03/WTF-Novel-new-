import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { backupData } from '@/server/controllers/adminController';

export const POST = (req: NextRequest) => handle(req, backupData, { admin: true });
