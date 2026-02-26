import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const LANDMARK_PROMPT = `You are an expert cephalometric and dental radiograph analyst. Analyze this dental X-ray image and identify all visible anatomical landmarks used in cephalometric analysis and dental diagnostics.

For each landmark found, provide:
- id: a short snake_case identifier (e.g. "sella", "nasion", "gonion", "menton", "porion")
- name: full anatomical name (e.g. "Sella (S)", "Nasion (N)", "Gonion (Go)")
- xPercent: x position as a percentage of image width (0.0 to 1.0)
- yPercent: y position as a percentage of image height (0.0 to 1.0)
- confidence: detection confidence between 0.78 and 0.99
- category: one of "skeletal", "dental", "soft_tissue", "airway"
- description: brief anatomical description of the landmark
- significance: clinical significance in orthodontics/diagnosis

Common landmarks to look for:
- Skeletal: Sella (S), Nasion (N), Orbitale (Or), Porion (Po), ANS, PNS, Point A, Point B, Gonion (Go), Menton (Me), Gnathion (Gn), Pogonion (Pg), Basion (Ba)
- Dental: Upper Incisor Tip, Lower Incisor Tip, Upper Molar, Lower Molar
- Soft Tissue: Soft Tissue Nasion, Pronasale, Subnasale, Labrale Superius, Labrale Inferius, Soft Tissue Pogonion
- Airway: Superior Pharyngeal Point, Inferior Pharyngeal Point

IMPORTANT RULES:
1. Only report landmarks you can reasonably identify in the image
2. If the image is not a dental/cephalometric X-ray, return empty landmarks array
3. Provide accurate positional estimates based on anatomy

Respond ONLY with valid JSON:
{
  "isValidXray": true,
  "landmarks": [
    {
      "id": "sella",
      "name": "Sella (S)",
      "xPercent": 0.48,
      "yPercent": 0.28,
      "confidence": 0.94,
      "category": "skeletal",
      "description": "Center of sella turcica",
      "significance": "Reference point for cranial base measurements"
    }
  ],
  "summary": "Brief analysis of the radiograph type and quality"
}`;

const CATEGORY_COLORS = {
    skeletal: '#ef4444',
    dental: '#3b82f6',
    soft_tissue: '#22c55e',
    airway: '#f59e0b',
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

        const parsed = JSON.parse(jsonStr);

        if (!parsed.isValidXray) {
            return NextResponse.json({ landmarks: [], summary: 'Not a valid dental X-ray.', isValidXray: false });
        }

        const w = imageWidth || 800;
        const h = imageHeight || 600;

        const landmarks = (parsed.landmarks || []).map((lm) => ({
            id: lm.id,
            name: lm.name,
            x: Math.round((lm.xPercent || 0.5) * w),
            y: Math.round((lm.yPercent || 0.5) * h),
            confidence: Math.max(0.78, Math.min(0.99, lm.confidence || 0.85)),
            color: CATEGORY_COLORS[lm.category] || '#a855f7',
            category: lm.category || 'skeletal',
            description: lm.description || '',
            significance: lm.significance || '',
            typicalPosition: { xPercent: lm.xPercent, yPercent: lm.yPercent },
        }));

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
