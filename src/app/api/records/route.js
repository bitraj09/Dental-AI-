import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        console.log('[Records POST] Session:', session ? { id: session.user?.id, name: session.user?.name, email: session.user?.email } : 'NO SESSION');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
        }

        const data = await req.json();
        const { type, patientName, findings, summary, imageThumbnail } = data;

        if (!type || !findings || !summary) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userId = parseInt(session.user.id);
        console.log('[Records POST] Creating record for userId:', userId, 'type:', type);

        const record = await prisma.record.create({
            data: {
                type,
                patientName: patientName || 'Unknown Patient',
                findings,
                summary,
                imageThumbnail,
                userId,
            },
        });

        console.log('[Records POST] Record created successfully, id:', record.id);
        return NextResponse.json({ message: 'Record saved successfully', record });
    } catch (error) {
        console.error('[Records API Error]:', error.message, error.stack);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const records = await prisma.record.findMany({
            where: { userId: parseInt(session.user.id) },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ records });
    } catch (error) {
        console.error('[Records GET API Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
