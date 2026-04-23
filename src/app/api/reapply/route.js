import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * POST /api/reapply
 * Allows a REJECTED user to re-apply (sets status back to PENDING).
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.status !== 'REJECTED') {
            return NextResponse.json({ error: 'Only rejected users can re-apply' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'PENDING',
                rejectionReason: null,
            },
        });

        return NextResponse.json({ message: 'Re-application submitted successfully' });
    } catch (error) {
        console.error('[Reapply API Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
