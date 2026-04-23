import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * Verify the requesting user is an ADMIN.
 */
async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
    });

    if (!user || user.role !== 'ADMIN') return null;
    return user;
}

/**
 * GET /api/admin/users
 * Returns all users grouped by status.
 */
export async function GET(req) {
    const admin = await verifyAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED, or null for all

    const where = status ? { status } : {};

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            collegeName: true,
            collegeYear: true,
            collegeIdNumber: true,
            idCardPath: true,
            role: true,
            status: true,
            rejectionReason: true,
            createdAt: true,
            _count: { select: { records: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Count by status
    const counts = await prisma.user.groupBy({
        by: ['status'],
        _count: true,
    });

    const stats = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        total: 0,
    };

    counts.forEach(c => {
        stats[c.status] = c._count;
        stats.total += c._count;
    });

    return NextResponse.json({ users, stats }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
}

/**
 * POST /api/admin/users
 * Approve or reject a user.
 * Body: { userId, action: 'approve' | 'reject', reason?: string }
 */
export async function POST(req) {
    const admin = await verifyAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, action, reason, password, secretKey } = await req.json();

    if (!userId || !['approve', 'reject', 'delete'].includes(action)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'delete') {
        if (secretKey !== '0905') {
            return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 });
        }

        try {
            await prisma.user.delete({ where: { id: userId } });
            return NextResponse.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete error:', error);
            // In case of foreign key constraints, we might want to just set status or throw
            return NextResponse.json({ error: 'Failed to delete user. They might have related data.' }, { status: 500 });
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            status: action === 'approve' ? 'APPROVED' : 'REJECTED',
            rejectionReason: action === 'reject' ? (reason || 'No reason provided') : null,
        },
    });

    return NextResponse.json({
        message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            status: updatedUser.status,
        },
    });
}
