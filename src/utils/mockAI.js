// Simulated AI engine — returns realistic dental analysis results
// Designed to be swapped with a real ML model (TF.js / ONNX) in the future
//
// V3: DETERMINISTIC — same image always gives identical results.
//     Uses a seeded PRNG (Mulberry32) derived from image content hash.
//     Theme-neutral colours. Anatomical consistency preserved.

import landmarks, { landmarkCategories } from '@/data/landmarkData';
import conditions from '@/data/diagnosisData';
import { ageParameters } from '@/data/forensicData';

// ── Seeded PRNG (Mulberry32) ────────────────────────────────────────
// Replaces Math.random() so that the same seed → same sequence every time.

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Fast hash of a string → 32-bit unsigned int.
 * Used to turn an image dataURL into a repeatable seed.
 */
function hashString(str) {
    let h = 0x811c9dc5; // FNV offset
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193); // FNV prime
    }
    return h >>> 0;
}

/**
 * Call this once per image to get a deterministic seed.
 * Pass the base64 data-URL (or any unique string for the image).
 */
export function getImageSeed(imageDataUrl) {
    if (!imageDataUrl) return Date.now();
    // Sample evenly across the string for speed (full strings can be huge)
    const step = Math.max(1, Math.floor(imageDataUrl.length / 4000));
    let sample = '';
    for (let i = 0; i < imageDataUrl.length; i += step) {
        sample += imageDataUrl[i];
    }
    return hashString(sample);
}

// ── Seeded helper functions ──────────────────────────────────────────

function createHelpers(seed) {
    const rng = mulberry32(seed);

    function rand(min, max) {
        return rng() * (max - min) + min;
    }

    function gaussRand(mean, stdDev) {
        const u1 = rng();
        const u2 = rng();
        const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, Math.min(1, mean + z * stdDev));
    }

    function jitter(value, amount = 0.015) {
        return Math.max(0.02, Math.min(0.98, value + (rng() - 0.5) * 2 * amount));
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    return { rng, rand, gaussRand, jitter, shuffle };
}

// Simulate processing delay
export function simulateDelay(ms = 2500) {
    return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 500));
}

// ── Anatomical tooth zones (% positions on a standard OPG)──────────
const toothZones = [
    { label: 'UR8 region', xPct: 0.12, yPct: 0.35, wPct: 0.07, hPct: 0.10 },
    { label: 'UR4-5 region', xPct: 0.22, yPct: 0.38, wPct: 0.06, hPct: 0.12 },
    { label: 'UR2-3 region', xPct: 0.32, yPct: 0.35, wPct: 0.06, hPct: 0.13 },
    { label: 'Upper anterior', xPct: 0.44, yPct: 0.32, wPct: 0.12, hPct: 0.14 },
    { label: 'UL2-3 region', xPct: 0.62, yPct: 0.35, wPct: 0.06, hPct: 0.13 },
    { label: 'UL4-5 region', xPct: 0.72, yPct: 0.38, wPct: 0.06, hPct: 0.12 },
    { label: 'UL8 region', xPct: 0.82, yPct: 0.35, wPct: 0.07, hPct: 0.10 },
    { label: 'LR8 region', xPct: 0.14, yPct: 0.62, wPct: 0.08, hPct: 0.12 },
    { label: 'LR6-7 region', xPct: 0.22, yPct: 0.60, wPct: 0.07, hPct: 0.13 },
    { label: 'LR4-5 region', xPct: 0.30, yPct: 0.58, wPct: 0.06, hPct: 0.13 },
    { label: 'Lower anterior', xPct: 0.42, yPct: 0.58, wPct: 0.16, hPct: 0.12 },
    { label: 'LL4-5 region', xPct: 0.64, yPct: 0.58, wPct: 0.06, hPct: 0.13 },
    { label: 'LL6-7 region', xPct: 0.71, yPct: 0.60, wPct: 0.07, hPct: 0.13 },
    { label: 'LL8 region', xPct: 0.82, yPct: 0.62, wPct: 0.08, hPct: 0.12 },
];

const zoneConditionAffinity = {
    'UR8 region': ['impacted_tooth', 'dentigerous_cyst', 'dental_caries'],
    'UR4-5 region': ['dental_caries', 'periapical_lesion', 'root_resorption'],
    'UR2-3 region': ['dental_caries', 'supernumerary_tooth', 'widened_pdl'],
    'Upper anterior': ['supernumerary_tooth', 'periapical_lesion', 'root_fracture'],
    'UL2-3 region': ['dental_caries', 'periapical_lesion', 'root_resorption'],
    'UL4-5 region': ['dental_caries', 'periapical_lesion', 'calculus'],
    'UL8 region': ['impacted_tooth', 'dentigerous_cyst', 'dental_caries'],
    'LR8 region': ['impacted_tooth', 'dentigerous_cyst', 'bone_loss'],
    'LR6-7 region': ['dental_caries', 'bone_loss', 'periapical_lesion'],
    'LR4-5 region': ['dental_caries', 'widened_pdl', 'calculus'],
    'Lower anterior': ['calculus', 'bone_loss', 'root_fracture'],
    'LL4-5 region': ['dental_caries', 'widened_pdl', 'calculus'],
    'LL6-7 region': ['dental_caries', 'bone_loss', 'periapical_lesion'],
    'LL8 region': ['impacted_tooth', 'dentigerous_cyst', 'bone_loss'],
};

// ── Landmark Detection ───────────────────────────────────────────────

/**
 * Detects ALL landmarks deterministically for a given image seed.
 * Returns polygon contour data for each landmark (CVAT-style mask shapes).
 */
export function detectLandmarks(imageWidth, imageHeight, seed = 0) {
    const { gaussRand, jitter } = createHelpers(seed);

    return landmarks.map((lm) => {
        const conf = parseFloat(gaussRand(0.93, 0.035).toFixed(2));

        // Build polygon from typicalPolygon with slight jitter
        const offsetX = (jitter(0.5, 0.008) - 0.5); // small random shift
        const offsetY = (jitter(0.5, 0.008) - 0.5);
        const polygon = (lm.typicalPolygon || []).map(([px, py]) => ({
            x: Math.round(Math.max(0, Math.min(1, px + offsetX)) * imageWidth),
            y: Math.round(Math.max(0, Math.min(1, py + offsetY)) * imageHeight),
        }));

        // Compute center of polygon for label placement
        let cx = 0, cy = 0;
        if (polygon.length > 0) {
            polygon.forEach(p => { cx += p.x; cy += p.y; });
            cx = Math.round(cx / polygon.length);
            cy = Math.round(cy / polygon.length);
        } else {
            cx = Math.round(jitter(lm.typicalPosition.xPercent, 0.012) * imageWidth);
            cy = Math.round(jitter(lm.typicalPosition.yPercent, 0.012) * imageHeight);
        }

        return {
            ...lm,
            polygon,
            centerX: cx,
            centerY: cy,
            confidence: Math.max(0.78, Math.min(0.99, conf)),
            color: lm.instanceColor || landmarkCategories[lm.category]?.color || '#a855f7',
        };
    });
}

// ── Patient Diagnosis ────────────────────────────────────────────────

/**
 * Deterministic diagnosis — same seed always returns the same conditions,
 * same zones, same severity, same bounding boxes.
 */
export function diagnoseConditions(imageWidth, imageHeight, seed = 0) {
    const { rand, gaussRand, jitter, shuffle } = createHelpers(seed);

    const numFindings = Math.floor(rand(2, 5));
    const shuffledZones = shuffle(toothZones);
    const selectedZones = shuffledZones.slice(0, numFindings);

    return selectedZones.map((zone) => {
        const affinityIds = zoneConditionAffinity[zone.label] || ['dental_caries'];
        const condId = affinityIds[Math.floor(rand(0, affinityIds.length))];
        const cond = conditions.find((c) => c.id === condId) || conditions[0];

        const sevWeights = cond.severityLevels.map((_, i) =>
            i === 0 ? 0.5 : i === 1 ? 0.35 : 0.15
        );
        let r = rand(0, 1);
        let sevIdx = 0;
        for (let i = 0; i < sevWeights.length; i++) {
            r -= sevWeights[i];
            if (r <= 0) { sevIdx = i; break; }
        }
        const severity = cond.severityLevels[sevIdx];

        const bx = jitter(zone.xPct, 0.01) * imageWidth;
        const by = jitter(zone.yPct, 0.01) * imageHeight;
        const bw = zone.wPct * imageWidth * rand(0.85, 1.15);
        const bh = zone.hPct * imageHeight * rand(0.85, 1.15);

        const baseConf = cond.id === 'dental_caries' ? 0.94
            : cond.id === 'impacted_tooth' ? 0.96
                : cond.id === 'calculus' ? 0.91 : 0.88;
        const conf = parseFloat(gaussRand(baseConf, 0.03).toFixed(2));

        return {
            ...cond,
            severity,
            confidence: Math.max(0.72, Math.min(0.99, conf)),
            recommendation: cond.recommendations[sevIdx] || cond.recommendations[0],
            toothZone: zone.label,
            bbox: {
                x: Math.round(bx),
                y: Math.round(by),
                width: Math.round(bw),
                height: Math.round(bh),
            },
            color: cond.color,
        };
    });
}

// ── Forensic Age Estimation ──────────────────────────────────────────

/**
 * Deterministic age estimation — same seed always returns the same age,
 * same parameters, same confidence.
 */
export function estimateAge(seed = 0) {
    const { rand, gaussRand } = createHelpers(seed);

    const trueAge = Math.floor(rand(5, 70));

    const parameterResults = ageParameters.map((param) => {
        let matchedRange = param.ageRanges[0];
        for (let i = 0; i < param.ageRanges.length; i++) {
            const ar = param.ageRanges[i];
            const nums = ar.range.match(/\d+/g);
            if (nums) {
                const low = parseInt(nums[0]);
                const high = nums[1] ? parseInt(nums[1]) : 100;
                if (trueAge >= low && trueAge <= high) {
                    matchedRange = ar;
                    break;
                }
            }
        }

        const ageConfBonus = trueAge < 18 ? 0.06 : trueAge < 35 ? 0.02 : -0.02;
        const paramConf = parseFloat(
            gaussRand(0.87 + ageConfBonus, 0.03).toFixed(2)
        );

        return {
            id: param.id,
            name: param.name,
            description: param.description,
            weight: param.weight,
            finding: matchedRange.expected,
            ageRange: matchedRange.range,
            confidence: Math.max(0.68, Math.min(0.99, paramConf)),
        };
    });

    const totalWeight = parameterResults.reduce((s, p) => s + p.weight, 0);
    const overallConf =
        parameterResults.reduce((s, p) => s + p.confidence * p.weight, 0) / totalWeight;

    const uncertainty =
        trueAge < 12 ? Math.floor(rand(1, 3))
            : trueAge < 25 ? Math.floor(rand(2, 4))
                : trueAge < 45 ? Math.floor(rand(3, 6))
                    : Math.floor(rand(4, 8));

    return {
        estimatedAge: trueAge,
        minAge: Math.max(0, trueAge - uncertainty),
        maxAge: trueAge + uncertainty,
        confidence: parseFloat(overallConf.toFixed(2)),
        parameters: parameterResults,
    };
}

// ── Education Quiz ───────────────────────────────────────────────────

function buildQuizQuestion(target, excludeIds = []) {
    const sameCategory = landmarks.filter(
        (l) => l.id !== target.id && l.category === target.category && !excludeIds.includes(l.id)
    );
    const otherCategory = landmarks.filter(
        (l) => l.id !== target.id && l.category !== target.category && !excludeIds.includes(l.id)
    );

    let distractors = [];
    const samePick = sameCategory.sort(() => Math.random() - 0.5).slice(0, 2);
    distractors.push(...samePick);
    const remaining = 3 - distractors.length;
    const otherPick = otherCategory.sort(() => Math.random() - 0.5).slice(0, remaining);
    distractors.push(...otherPick);

    const options = [target, ...distractors].sort(() => Math.random() - 0.5);

    return {
        landmark: target,
        position: {
            xPercent: target.typicalPosition.xPercent + (Math.random() - 0.5) * 0.02,
            yPercent: target.typicalPosition.yPercent + (Math.random() - 0.5) * 0.02,
        },
        options: options.map((o) => ({ id: o.id, name: o.name })),
        correctId: target.id,
    };
}

/**
 * Quiz questions use normal Math.random() since we want different
 * questions each time (not image-dependent).
 */
export function generateQuizQuestion(excludeIds = []) {
    const available = landmarks.filter((l) => !excludeIds.includes(l.id));
    if (available.length === 0) return null;

    const target = available[Math.floor(Math.random() * available.length)];
    return buildQuizQuestion(target, excludeIds);
}

export function generateQuizQuestionFromLandmark(target, excludeIds = []) {
    if (!target) return null;
    return buildQuizQuestion(target, excludeIds);
}
