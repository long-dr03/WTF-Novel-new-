import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getDashboardStats } from '@/server/controllers/adminController';

export const GET = (req: NextRequest) => handle(req, getDashboardStats, { admin: true });
