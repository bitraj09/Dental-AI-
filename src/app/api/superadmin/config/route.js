import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const configs = await prisma.systemConfig.findMany();
        const configMap = {};
        for (const config of configs) {
            configMap[config.key] = config.value;
        }

        return NextResponse.json({ config: configMap });
    } catch (error) {
        console.error('Fetch config error:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { key, value } = await req.json();

        // Upsert config value
        const updatedConfig = await prisma.systemConfig.upsert({
            where: { key: key },
            update: { value: value },
            create: { key: key, value: value }
        });

        return NextResponse.json({ success: true, config: updatedConfig });
    } catch (error) {
        console.error('Update config error:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
