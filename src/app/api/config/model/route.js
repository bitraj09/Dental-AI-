export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'activeModel' }
        });

        return NextResponse.json({ activeModel: config?.value || 'GOOGLE_AI' });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch active model' }, { status: 500 });
    }
}
