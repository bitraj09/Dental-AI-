import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const FORENSIC_PROMPT = `You are an expert forensic odontologist. Analyze this OPG (Orthopantomogram) panoramic X-ray image and estimate the subject's age.

IMPORTANT: This system ONLY accepts OPG (panoramic) radiographs. If the image is not a panoramic OPG dental X-ray, you MUST respond with isValidXray: false.

Evaluate these forensic dental parameters:
1. Tooth Eruption Status - Which teeth have erupted, partially erupted, or are unerupted
2. Root Development - Stage of root formation (incomplete, apex open, apex closed)
3. Third Molar Development - Wisdom teeth development stage
4. Pulp Chamber Size - Degree of secondary dentin deposition (pulp narrowing with age)
5. Cementum Deposition - Root surface changes
6. Tooth Wear/Attrition - Degree of occlusal/incisal wear
7. Root Transparency - Translucency of root dentin (increases with age)

For each parameter, provide:
- id: parameter identifier (e.g. "eruption_status", "root_development")
- name: display name
- description: what this parameter measures
- weight: importance weight (0.0 to 1.0, all should sum to approximately 1.0)
- finding: what you observe in this X-ray
- ageRange: the age range this finding corresponds to (e.g. "12-18 years", "25-35 years")
- confidence: how confident you are in this assessment (0.68 to 0.99)

IMPORTANT:
1. Provide your best age estimate based on ALL visible dental indicators
2. If the image is NOT an OPG dental X-ray, set isValidXray to false and provide explanation in summary.
3. Be conservative with age ranges for older patients

Respond ONLY with valid JSON:
{
  "isValidXray": true,
  "estimatedAge": 28,
  "minAge": 25,
  "maxAge": 32,
  "confidence": 0.85,
  "parameters": [
    {
      "id": "eruption_status",
      "name": "Tooth Eruption Status",
      "description": "Assessment of which teeth have fully erupted",
      "weight": 0.20,
      "finding": "All permanent teeth erupted including third molars",
      "ageRange": "18-30 years",
      "confidence": 0.88
    }
  ],
  "summary": "Brief forensic assessment narrative"
}`;

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const { image } = await request.json();
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
                    FORENSIC_PROMPT,
                    { inlineData: { mimeType: `image/${base64Match[1]}`, data: base64Match[2] } },
                ]);
                break;
            } catch (err) {
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (is429 && attempt < maxRetries) {
                    const delay = (attempt + 1) * 10000; // 10s, 20s, 30s
                    console.log(`[Gemini Forensics] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
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
            console.warn('[Gemini Forensics] Failed to parse JSON, assuming invalid X-ray:', responseText.substring(0, 100));
            return NextResponse.json({ result: null, summary: 'The uploaded image does not appear to be a valid dental X-ray. Please upload a panoramic dental radiograph.', isValidXray: false });
        }

        if (!parsed.isValidXray) {
            return NextResponse.json({ result: null, summary: 'Not a valid dental X-ray.', isValidXray: false });
        }

        const estimation = {
            estimatedAge: parsed.estimatedAge || 25,
            minAge: parsed.minAge || (parsed.estimatedAge - 5),
            maxAge: parsed.maxAge || (parsed.estimatedAge + 5),
            confidence: Math.max(0.60, Math.min(0.99, parsed.confidence || 0.80)),
            parameters: (parsed.parameters || []).map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                weight: p.weight || 0.15,
                finding: p.finding || '',
                ageRange: p.ageRange || 'Unknown',
                confidence: Math.max(0.60, Math.min(0.99, p.confidence || 0.80)),
            })),
        };

        return NextResponse.json({
            result: estimation,
            summary: parsed.summary || 'Age estimation complete.',
            isValidXray: true,
            source: 'gemini',
        });

    } catch (error) {
        console.error('[Gemini Forensics Error]', error);
        return NextResponse.json({ error: `Gemini API error: ${error.message}` }, { status: 500 });
    }
}
