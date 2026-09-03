import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role'); // filter by role if provided

        const users = await prisma.user.findMany({
            where: role ? { role: role.toUpperCase() } : {},
            include: { _count: { select: { records: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const stats = {
            total: await prisma.user.count(),
            admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
            users: await prisma.user.count({ where: { role: 'USER' } }),
        };

        return NextResponse.json({ users, stats });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const { action, userId, name, email, password, role, collegeName } = payload;

        if (action === 'delete') {
            await prisma.record.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
            return NextResponse.json({ success: true, message: 'Deleted successfully' });
        }

        if (action === 'add') {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'USER',
                    status: 'APPROVED',
                    collegeName: collegeName || 'Admin Assigned',
                    collegeYear: 'N/A',
                    collegeIdNumber: 'N/A',
                }
            });
            return NextResponse.json({ success: true, user });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Action error:', error);
        return NextResponse.json({ error: 'Failed to process action: ' + error.message }, { status: 500 });
    }
}
