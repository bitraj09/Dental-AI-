import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * GET /api/admin/set-model
 * Returns the currently active AI model.
 */
export async function GET() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'activeModel' },
        });

        return NextResponse.json({
            activeModel: config?.value || 'GOOGLE_AI',
        });
    } catch (error) {
        return NextResponse.json({ activeModel: 'GOOGLE_AI' });
    }
}

/**
 * POST /api/admin/set-model
 * Sets the active AI model. Admin only.
 * Body: { model: 'GOOGLE_AI' | 'MOCK_AI' | 'OWN_AI' }
 */
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { model } = await req.json();
        const validModels = ['GOOGLE_AI', 'MOCK_AI', 'OWN_AI'];

        if (!validModels.includes(model)) {
            return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
        }

        await prisma.systemConfig.upsert({
            where: { key: 'activeModel' },
            update: { value: model },
            create: { key: 'activeModel', value: model },
        });

        return NextResponse.json({
            message: `Active model set to ${model}`,
            activeModel: model,
        });
    } catch (error) {
        console.error('[Set Model API Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
