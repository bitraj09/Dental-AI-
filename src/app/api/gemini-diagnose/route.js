import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const DENTAL_PROMPT = `You are an expert dental radiograph analyst. Analyze this OPG (Orthopantomogram) panoramic X-ray image and identify all visible dental conditions.

IMPORTANT: This system ONLY accepts OPG (panoramic) radiographs. If the image is not a panoramic OPG dental X-ray, you MUST respond with isValidXray: false.

For each condition found, provide:
- name: condition name. Must be one of: "Dental Caries", "Periapical Lesion", "Impacted Tooth", "Alveolar Bone Loss", "Root Fracture", "Calculus", "Dentigerous Cyst", "Root Resorption", "Supernumerary Tooth", "Widened PDL Space", "Hypercementosis", "Internal Resorption", "Retained Root", "Overhanging Restoration", "Secondary Caries", "Apical Periodontitis", "Pulp Calcification", "Radicular Cyst", "Odontoma", "Furcation Involvement", "Periodontal Abscess", "Sclerotic Bone", "Crown Defect", "Endodontically Treated Tooth", "Dental Implant", "Missing Tooth".
- severity: "mild", "moderate", or "severe"
- confidence: a number between 0.70 and 0.99
- description: brief clinical description of what you see
- recommendation: specific treatment recommendation
- toothZone: which region/tooth (use dental terminology like "UR8 region", "Lower anterior", "UL4-5 region", "LR6-7 region", etc.)
- bbox: approximate bounding box as percentages of image dimensions { xPct, yPct, wPct, hPct } where each value is between 0 and 1

IMPORTANT RULES:
1. Only report conditions you can actually identify in the image
2. If the image is NOT an OPG dental X-ray (e.g., it is a regular photo, a different type of X-ray, or unrelated content), respond with an empty findings array, set isValidXray to false, and explain WHY in the summary field.
3. Be conservative — do not hallucinate conditions
4. Report 0-8 findings depending on what's visible

Respond ONLY with valid JSON in this exact format:
{
  "isValidXray": true,
  "findings": [
    {
      "name": "Dental Caries (Cavity)",
      "severity": "moderate",
      "confidence": 0.92,
      "description": "Radiolucent area visible on the mesial surface of the tooth",
      "recommendation": "Dental restoration (filling) recommended",
      "toothZone": "LR6-7 region",
      "bbox": { "xPct": 0.22, "yPct": 0.60, "wPct": 0.07, "hPct": 0.13 }
    }
  ],
  "summary": "Brief overall assessment of the radiograph"
}`;

// Map condition names to colors
const CONDITION_COLORS = {
    'dental caries': '#ef4444',
    'cavity': '#ef4444',
    'secondary caries': '#e11d48',
    'periapical': '#f97316',
    'apical periodontitis': '#d97706',
    'abscess': '#be123c',
    'impacted': '#8b5cf6',
    'bone loss': '#f59e0b',
    'alveolar': '#f59e0b',
    'furcation': '#b91c1c',
    'fracture': '#ef4444',
    'calculus': '#a855f7',
    'tartar': '#a855f7',
    'cyst': '#4f46e5',
    'resorption': '#06b6d4',
    'internal resorption': '#db2777',
    'supernumerary': '#22c55e',
    'widened': '#64748b',
    'hypercementosis': '#0ea5e9',
    'retained root': '#65a30d',
    'restoration': '#c026d3', // overhang
    'missing': '#94a3b8',
    'crown': '#1d4ed8', // defect
    'filling': '#3b82f6',
    'pulp calcification': '#9333ea',
    'odontoma': '#059669',
    'sclerotic': '#047857',
    'endodontic': '#64748b',
    'root canal': '#64748b',
    'implant': '#475569'
};

function getConditionColor(name) {
    const lower = name.toLowerCase();
    for (const [key, color] of Object.entries(CONDITION_COLORS)) {
        if (lower.includes(key)) return color;
    }
    return '#a855f7'; // default purple
}

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured. Add it to your .env file.' },
                { status: 500 }
            );
        }

        const { image, imageWidth, imageHeight } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Extract base64 data from data URL
        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        const mimeType = `image/${base64Match[1]}`;
        const base64Data = base64Match[2];

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.1,
            }
        });

        // Send image to Gemini with retry for rate limits
        const maxRetries = 3;
        let result;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                result = await model.generateContent([
                    DENTAL_PROMPT,
                    { inlineData: { mimeType, data: base64Data } },
                ]);
                break; // success
            } catch (err) {
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests') || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (is429 && attempt < maxRetries) {
                    const delay = (attempt + 1) * 10000; // 10s, 20s, 30s
                    console.log(`[Gemini] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw err;
                }
            }
        }

        const responseText = result.response.text();

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[Gemini Diagnose] Failed to parse JSON, assuming invalid X-ray:', responseText.substring(0, 100));
            return NextResponse.json({ findings: [], summary: 'The uploaded image does not appear to be a valid dental X-ray. Please upload a panoramic dental radiograph.', isValidXray: false });
        }

        if (!parsed.isValidXray) {
            return NextResponse.json({
                findings: [],
                summary: 'The uploaded image does not appear to be a dental X-ray. Please upload a dental radiograph.',
                isValidXray: false,
            });
        }

        // Transform findings to match the app's expected format
        const findings = (parsed.findings || []).map((f) => ({
            name: f.name,
            severity: f.severity || 'moderate',
            confidence: Math.max(0.70, Math.min(0.99, f.confidence || 0.85)),
            description: f.description,
            recommendation: f.recommendation,
            toothZone: f.toothZone || 'Unspecified region',
            color: getConditionColor(f.name),
            bbox: {
                x: Math.round((f.bbox?.xPct || 0.3) * (imageWidth || 800)),
                y: Math.round((f.bbox?.yPct || 0.3) * (imageHeight || 600)),
                width: Math.round((f.bbox?.wPct || 0.1) * (imageWidth || 800)),
                height: Math.round((f.bbox?.hPct || 0.1) * (imageHeight || 600)),
            },
        }));

        return NextResponse.json({
            findings,
            summary: parsed.summary || 'Analysis complete.',
            isValidXray: true,
            source: 'gemini',
        });

    } catch (error) {
        console.error('[Gemini API Error]', error);
        return NextResponse.json(
            { error: `Gemini API error: ${error.message}` },
            { status: 500 }
        );
    }
}
