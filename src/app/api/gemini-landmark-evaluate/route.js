import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const EVALUATE_PROMPT = `You are an expert cephalometric and dental radiograph analyst and dental anatomy professor.

A dental student is practicing landmark identification on an OPG (Orthopantomogram) X-ray. They have been asked to draw the outline of a specific anatomical landmark, and you must evaluate how accurately they drew it.

TARGET LANDMARK: {{LANDMARK_NAME}}
LANDMARK DESCRIPTION: {{LANDMARK_DESCRIPTION}}
LANDMARK CATEGORY: {{LANDMARK_CATEGORY}}

The student drew a polygon on the image with these coordinates (as percentage values 0.0-1.0 of image dimensions):
{{STUDENT_POLYGON}}

TASK:
1. Identify where the actual {{LANDMARK_NAME}} is located on this OPG image.
2. Compare the student's drawn polygon with the actual location and shape of the landmark.
3. Evaluate accuracy considering: position, shape coverage, and whether the polygon captures the correct anatomical structure.

Respond ONLY with valid JSON:
{
  "isCorrect": true/false,
  "accuracyScore": 0-100,
  "feedback": "Detailed feedback explaining what the student did well and what they could improve. Be educational and encouraging.",
  "correctPolygon": [[xPercent, yPercent], ...],
  "overlapAssessment": "good" | "partial" | "poor" | "missed",
  "positionFeedback": "Brief note about position accuracy",
  "shapeFeedback": "Brief note about shape/coverage accuracy"
}

RULES:
1. Be educational and constructive — this is a learning tool
2. accuracyScore: 80-100 = excellent, 60-79 = good, 40-59 = needs work, 0-39 = incorrect area
3. isCorrect = true if accuracyScore >= 50 (student identified roughly the right area)
4. correctPolygon should trace the ACTUAL boundary of the landmark (8-12 points, percentage coords)
5. If the image is not a valid OPG, set accuracyScore to 0 and explain in feedback`;

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        const { image, landmark, studentPolygon, imageWidth, imageHeight } = await request.json();

        if (!image || !landmark || !studentPolygon) {
            return NextResponse.json(
                { error: 'Missing required fields: image, landmark, studentPolygon' },
                { status: 400 }
            );
        }

        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
            return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
        }

        // Build prompt with landmark info
        const polygonStr = studentPolygon
            .map(p => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}]`)
            .join(', ');

        const prompt = EVALUATE_PROMPT
            .replace(/\{\{LANDMARK_NAME\}\}/g, landmark.name)
            .replace('{{LANDMARK_DESCRIPTION}}', landmark.description || '')
            .replace('{{LANDMARK_CATEGORY}}', landmark.category || '')
            .replace('{{STUDENT_POLYGON}}', `[${polygonStr}]`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.2,
                topK: 1,
                topP: 0.2,
            }
        });

        // Retry with backoff for rate limits
        const maxRetries = 3;
        let result;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                result = await model.generateContent([
                    prompt,
                    { inlineData: { mimeType: `image/${base64Match[1]}`, data: base64Match[2] } },
                ]);
                break;
            } catch (err) {
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (is429 && attempt < maxRetries) {
                    const delay = (attempt + 1) * 10000;
                    console.log(`[Gemini Evaluate] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
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
            console.warn('[Gemini Evaluate] Failed to parse JSON:', responseText.substring(0, 200));
            return NextResponse.json({
                isCorrect: false,
                accuracyScore: 0,
                feedback: 'AI evaluation failed. Please try again.',
                correctPolygon: [],
                overlapAssessment: 'missed',
            });
        }

        // Convert correctPolygon percentage coords to absolute pixels if needed
        const w = imageWidth || 800;
        const h = imageHeight || 600;

        const correctPolygonAbs = (parsed.correctPolygon || []).map(([px, py]) => ({
            x: Math.round((px || 0) * w),
            y: Math.round((py || 0) * h),
        }));

        return NextResponse.json({
            isCorrect: parsed.isCorrect ?? false,
            accuracyScore: Math.max(0, Math.min(100, parsed.accuracyScore || 0)),
            feedback: parsed.feedback || 'No feedback available.',
            correctPolygon: parsed.correctPolygon || [],
            correctPolygonAbs: correctPolygonAbs,
            overlapAssessment: parsed.overlapAssessment || 'missed',
            positionFeedback: parsed.positionFeedback || '',
            shapeFeedback: parsed.shapeFeedback || '',
            source: 'gemini',
        });

    } catch (error) {
        console.error('[Gemini Evaluate Error]', error);
        return NextResponse.json(
            { error: `Gemini API error: ${error.message}` },
            { status: 500 }
        );
    }
}
