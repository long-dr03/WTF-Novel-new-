import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getSettings, updateSettings } from '@/server/controllers/adminController';

export const GET = (req: NextRequest) => handle(req, getSettings, { admin: true });
export const PUT = (req: NextRequest) => handle(req, updateSettings, { admin: true });
