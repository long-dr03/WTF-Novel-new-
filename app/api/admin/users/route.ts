import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getUsers } from '@/server/controllers/adminController';

export const GET = (req: NextRequest) => handle(req, getUsers, { admin: true });
