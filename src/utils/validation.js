import { GoogleGenerativeAI } from '@google/generative-ai';

const VALIDATION_PROMPT = `Analyze this image and determine if it is a valid panoramic dental OPG (Orthopantomogram) radiograph.
This system ONLY accepts panoramic dental OPG X-ray images. If the image is a regular photo, a document, a chest/hand/spine X-ray, a single tooth X-ray (periapical/bitewing), or any other non-panoramic dental X-ray, it is NOT a valid OPG.

Respond ONLY with a JSON object in this exact format:
{
  "isValidOpg": true,
  "reason": "Brief explanation if invalid, or empty if valid"
}`;

/**
 * Validates if an image is a panoramic dental OPG radiograph.
 * @param {string} image - Base64 image data URL
 * @returns {Promise<{isValid: boolean, reason?: string}>}
 */
export async function validateOpgImage(image) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[Validation] GEMINI_API_KEY is not configured. Bypassing validation.');
        return { isValid: true };
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
        return { isValid: false, reason: 'Invalid image format' };
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.1,
                responseMimeType: 'application/json',
            }
        });

        // Retry with backoff for rate limits
        const maxRetries = 3;
        let result;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                result = await model.generateContent([
                    VALIDATION_PROMPT,
                    { inlineData: { mimeType, data: base64Data } },
                ]);
                break;
            } catch (err) {
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
                if (is429 && attempt < maxRetries) {
                    const delay = (attempt + 1) * 5000; // 5s, 10s, 15s
                    console.warn(`[Validation API] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
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
        return {
            isValid: !!parsed.isValidOpg,
            reason: parsed.reason || 'Image is not a panoramic dental OPG.'
        };
    } catch (e) {
        console.error('[Validation API] Validation check failed:', e);
        // Fall back to true if Gemini service is down so local developer/users don't get completely blocked,
        // but log the error.
        return { isValid: true };
    }
}
