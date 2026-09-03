export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['FEATURE_LANDMARKS', 'FEATURE_DIAGNOSIS', 'FEATURE_FORENSICS', 'FEATURE_COMPARE', 'FEATURE_EDUCATION'] }
            }
        });

        const featureMap = {
            'Landmarks': true,
            'Diagnosis': true,
            'Forensics': true,
            'Compare': true,
            'Education': true,
            'Learning': true
        };

        for (const config of configs) {
            if (config.key === 'FEATURE_LANDMARKS' && config.value === 'false') featureMap['Landmarks'] = false;
            if (config.key === 'FEATURE_DIAGNOSIS' && config.value === 'false') featureMap['Diagnosis'] = false;
            if (config.key === 'FEATURE_FORENSICS' && config.value === 'false') featureMap['Forensics'] = false;
            if (config.key === 'FEATURE_COMPARE' && config.value === 'false') featureMap['Compare'] = false;
            if (config.key === 'FEATURE_EDUCATION' && config.value === 'false') featureMap['Education'] = false;
        }

        return NextResponse.json(featureMap);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
    }
}
