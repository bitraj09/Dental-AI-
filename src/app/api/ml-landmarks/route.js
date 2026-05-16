import { NextResponse } from 'next/server';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

/**
 * POST /api/ml-landmarks
 * Forwards the uploaded image to the FastAPI landmark service (denatlyolo.pt)
 * and returns landmarks in the same polygon format used by the Gemini route.
 */
export async function POST(req) {
    try {
        const { image, imageWidth, imageHeight } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Convert base64 dataURL → binary buffer → Blob
        const base64Data = image.split(',')[1];
        if (!base64Data) {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        // Call FastAPI landmark endpoint
        const mlRes = await fetch(`${ML_SERVICE_URL}/landmarks`, {
            method: 'POST',
            body: formData,
        });

        if (!mlRes.ok) {
            const errorText = await mlRes.text();
            throw new Error(`ML Service Error: ${mlRes.status} — ${errorText}`);
        }

        const data = await mlRes.json();

        // data.landmarks already in {id, name, polygon, centerX, centerY,
        //   confidence, color, category, description, significance} format
        return NextResponse.json({
            landmarks: data.landmarks || [],
            annotated_image: data.annotated_image || null,
            summary: `YOLO landmark model detected ${(data.landmarks || []).length} structure(s).`,
            isValidXray: true,
            source: 'yolo',
        });

    } catch (error) {
        console.error('[ML Landmarks API Error]', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
