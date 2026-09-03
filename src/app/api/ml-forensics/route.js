import { NextResponse } from 'next/server';
import { validateOpgImage } from '@/utils/validation';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

export async function POST(req) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Validate if the image is a valid panoramic OPG dental radiograph
        const validation = await validateOpgImage(image);
        if (!validation.isValid) {
            return NextResponse.json({
                result: null,
                summary: validation.reason || 'The uploaded image does not appear to be a valid OPG dental X-ray. Please upload a panoramic dental radiograph.',
                isValidXray: false,
                source: 'ml_pipeline',
            });
        }

        // Convert base64 dataUrl to Blob
        const base64Data = image.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        // Call FastAPI Python ML service /forensics
        const mlRes = await fetch(`${ML_SERVICE_URL}/forensics`, {
            method: 'POST',
            body: formData,
        });

        if (!mlRes.ok) {
            const errorText = await mlRes.text();
            throw new Error(`ML Service Error: ${mlRes.status} ${errorText}`);
        }

        const data = await mlRes.json();

        if (data.isValidXray === false) {
            return NextResponse.json({
                result: null,
                summary: data.summary || 'The uploaded image does not appear to be a valid OPG dental X-ray. Please upload a panoramic dental radiograph.',
                isValidXray: false,
                source: 'ml_pipeline',
            });
        }

        return NextResponse.json({
            result: {
                estimatedAge: data.estimatedAge,
                minAge: data.minAge,
                maxAge: data.maxAge,
                confidence: data.confidence,
                parameters: data.parameters || [],
                full_visualization: data.full_visualization,
                target_teeth: data.target_teeth || {},
                detected_count: data.detected_count || 0,
            },
            summary: data.summary,
            isValidXray: true,
            source: 'ml_pipeline',
        });

    } catch (error) {
        console.error('ML Forensics API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
