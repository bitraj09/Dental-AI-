/**
 * Reusable server-side authentication guard for API routes.
 * 
 * Usage:
 *   import { requireAuth, requireApprovedUser } from '@/lib/auth-guard';
 *   
 *   export async function POST(req) {
 *       const { session, error } = await requireApprovedUser();
 *       if (error) return error;
 *       // ... handler logic
 *   }
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Require any authenticated session (any role, any status).
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return {
            session: null,
            error: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }),
        };
    }
    return { session, error: null };
}

/**
 * Require an authenticated AND approved user.
 */
export async function requireApprovedUser() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return {
            session: null,
            error: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }),
        };
    }
    if (session.user.status !== 'APPROVED') {
        return {
            session: null,
            error: NextResponse.json({ error: 'Account not approved.' }, { status: 403 }),
        };
    }
    return { session, error: null };
}

/**
 * Require ADMIN role.
 */
export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return {
            session: null,
            error: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }),
        };
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        return {
            session: null,
            error: NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 }),
        };
    }
    return { session, error: null };
}
