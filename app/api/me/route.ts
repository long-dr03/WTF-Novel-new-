import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getProfile, updateProfile } from '@/server/controllers/authendication';

export const GET = (req: NextRequest) => handle(req, getProfile, { auth: true });
export const PUT = (req: NextRequest) => handle(req, updateProfile, { auth: true });
