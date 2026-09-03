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
                findings: [],
                annotated_image: null,
                summary: validation.reason || 'The uploaded image does not appear to be a valid OPG dental X-ray. Please upload a panoramic dental radiograph.',
                isValidXray: false,
                source: 'yolo',
            });
        }

        // Convert base64 dataUrl to Blob
        const base64Data = image.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', blob, 'image.jpg');

        // Call the FastAPI Python ML service
        const mlRes = await fetch(`${ML_SERVICE_URL}/analyze`, {
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
                findings: [],
                annotated_image: null,
                summary: 'The uploaded image does not appear to be a valid OPG dental X-ray. Please upload a panoramic dental radiograph.',
                isValidXray: false,
                source: 'yolo',
            });
        }
        
        // Map the python response to the format expected by the frontend
        // Detections include: { class, confidence, box: [x1, y1, x2, y2] }
        
        const mappedFindings = (data.detections || []).map((det, idx) => {
            const w = det.box[2] - det.box[0];
            const h = det.box[3] - det.box[1];
            
            // Assign severity and color based on class
            let severity = 'Moderate';
            let color = '#f59e0b';
            let recommendation = 'Review clinically and consider treatment.';
            
            if (det.class === 'Caries') {
                severity = 'Moderate';
                color = '#f59e0b';
                recommendation = 'Restoration recommended. Check vitality if near pulp.';
            } else if (det.class === 'Deep Caries') {
                severity = 'Severe';
                color = '#ef4444';
                recommendation = 'Endodontic evaluation required. High risk of pulp exposure.';
            } else if (det.class === 'Periapical Lesion') {
                severity = 'Severe';
                color = '#dc2626';
                recommendation = 'Root canal treatment or extraction required.';
            } else if (det.class === 'Impacted Tooth') {
                severity = 'Moderate';
                color = '#8b5cf6';
                recommendation = 'Monitor for cyst formation or refer for surgical extraction.';
            }

            return {
                id: `ml_${idx}`,
                name: det.class,
                severity: severity,
                confidence: det.confidence,
                recommendation: recommendation,
                toothZone: det.class,
                bbox: {
                    x: Math.round(det.box[0]),
                    y: Math.round(det.box[1]),
                    width: Math.round(w),
                    height: Math.round(h),
                },
                color: color,
            };
        });

        return NextResponse.json({ 
            findings: mappedFindings, 
            annotated_image: data.annotated_image,
            isValidXray: data.isValidXray !== false 
        });

    } catch (error) {
        console.error('ML Diagnose API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
