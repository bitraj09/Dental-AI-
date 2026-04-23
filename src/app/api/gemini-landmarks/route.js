import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const LANDMARK_PROMPT = `You are an expert cephalometric and dental radiograph analyst. Analyze this OPG (Orthopantomogram) panoramic X-ray image and identify anatomical landmarks with polygon contour outlines.

IMPORTANT: This system ONLY accepts OPG (panoramic) radiographs. If the image is not a panoramic OPG dental X-ray, you MUST respond with isValidXray: false.

For each landmark/anatomical structure found, provide:
- id: a short snake_case identifier (e.g. "maxillary_sinus", "mandibular_canal", "nasal_septum")
- name: full anatomical name
- polygon: An array of [xPercent, yPercent] coordinate pairs (each 0.0 to 1.0) that trace the OUTLINE/CONTOUR of the anatomical structure on the image. Provide at least 6-8 points per structure to form a smooth polygon outline. These should trace the visible boundary of the structure.
- confidence: detection confidence between 0.78 and 0.99
- category: one of "mandible", "maxilla", "tmj", "midline", "other"
- description: brief anatomical description
- significance: clinical significance

Anatomical structures to identify and outline:
- Mandible: Mental Foramen, Mandibular Canal, Coronoid Process, Angle of Mandible (Gonion), External Oblique Ridge, Genial Tubercle, Inferior Border of Mandible, Sigmoid Notch
- Maxilla: Maxillary Sinus, Hard Palate, Zygomatic Arch, Maxillary Tuberosity, Inferior Orbital Rim, Incisive Foramen
- TMJ: Mandibular Condyle, Articular Eminence
- Midline: Nasal Septum, Nasal Cavity
- Other: Hyoid Bone, Cervical Spine, Ear Lobe (Ghost Image)

IMPORTANT RULES:
1. Only report structures you can reasonably identify in the image
2. If the image is NOT an OPG dental X-ray, return empty landmarks array, set isValidXray to false
3. The polygon points should trace the visible boundary/contour of each structure
4. Order polygon points clockwise or counter-clockwise to form a proper closed shape
5. Use at least 6 points per polygon for smooth outlines, more for complex shapes like the mandibular canal

Respond ONLY with valid JSON:
{
  "isValidXray": true,
  "landmarks": [
    {
      "id": "maxillary_sinus",
      "name": "Maxillary Sinus",
      "polygon": [[0.18, 0.22], [0.22, 0.18], [0.28, 0.16], [0.34, 0.18], [0.38, 0.22], [0.39, 0.28], [0.38, 0.34], [0.34, 0.38], [0.28, 0.39], [0.22, 0.38], [0.18, 0.34], [0.17, 0.28]],
      "confidence": 0.94,
      "category": "maxilla",
      "description": "Pneumatic space within the maxilla",
      "significance": "Important in sinus lift procedures"
    }
  ],
  "summary": "Brief analysis of the radiograph"
}`;

// Vivid instance colors for Gemini-detected landmarks
const INSTANCE_COLORS = [
    '#FF6B00', '#00E5FF', '#00FF88', '#FF0055', '#FFD600',
    '#2196F3', '#E040FB', '#FF4081', '#76FF03', '#FFAB40',
    '#B388FF', '#64FFDA', '#F48FB1', '#80DEEA', '#B2FF59',
    '#EA80FC', '#18FFFF', '#FF9100', '#40C4FF', '#CCFF90',
    '#FF1744', '#00BFA5', '#FFEA00', '#AA00FF', '#C6FF00',
];

const CATEGORY_COLORS = {
    mandible: '#a855f7',
    maxilla: '#ec4899',
    tmj: '#f59e0b',
    midline: '#ef4444',
    other: '#64748b',
};

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const { image, imageWidth, imageHeight } = await request.json();
        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.1,
            }
        });

        // Retry with backoff for rate limits
        const maxRetries = 3;
        let result;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                result = await model.generateContent([
                    LANDMARK_PROMPT,
                    { inlineData: { mimeType: `image/${base64Match[1]}`, data: base64Match[2] } },
                ]);
                break;
            } catch (err) {
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (is429 && attempt < maxRetries) {
                    const delay = (attempt + 1) * 10000; // 10s, 20s, 30s
                    console.log(`[Gemini Landmarks] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw err;
                }
            }
        }

        const responseText = result.response.text();
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[Gemini Landmarks] Failed to parse JSON, assuming invalid X-ray:', responseText.substring(0, 100));
            return NextResponse.json({ landmarks: [], summary: 'This image does not appear to be a valid OPG dental X-ray. It must be a panoramic dental radiograph.', isValidXray: false });
        }

        if (!parsed.isValidXray) {
            return NextResponse.json({ landmarks: [], summary: parsed.summary || 'Not a valid dental X-ray.', isValidXray: false });
        }

        const w = imageWidth || 800;
        const h = imageHeight || 600;

        const landmarks = (parsed.landmarks || []).map((lm, idx) => {
            // Convert polygon percentage coordinates to absolute pixels
            const polygon = (lm.polygon || []).map(([px, py]) => ({
                x: Math.round((px || 0) * w),
                y: Math.round((py || 0) * h),
            }));

            // Compute center of polygon
            let cx = 0, cy = 0;
            if (polygon.length > 0) {
                polygon.forEach(p => { cx += p.x; cy += p.y; });
                cx = Math.round(cx / polygon.length);
                cy = Math.round(cy / polygon.length);
            } else {
                // Fallback: if no polygon, use center estimate
                cx = Math.round(0.5 * w);
                cy = Math.round(0.5 * h);
            }

            return {
                id: lm.id,
                name: lm.name,
                polygon,
                centerX: cx,
                centerY: cy,
                confidence: Math.max(0.78, Math.min(0.99, lm.confidence || 0.85)),
                color: INSTANCE_COLORS[idx % INSTANCE_COLORS.length],
                category: lm.category || 'other',
                description: lm.description || '',
                significance: lm.significance || '',
            };
        });

        return NextResponse.json({
            landmarks,
            summary: parsed.summary || 'Analysis complete.',
            isValidXray: true,
            source: 'gemini',
        });

    } catch (error) {
        console.error('[Gemini Landmarks Error]', error);
        return NextResponse.json({ error: `Gemini API error: ${error.message}` }, { status: 500 });
    }
}

