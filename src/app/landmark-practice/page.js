'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiCheck, FiX, FiRotateCcw, FiTrash2, FiSend, FiSkipForward, FiZap, FiCpu, FiBox, FiClock, FiEdit3 } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import landmarks, { landmarkCategories } from '@/data/landmarkData';
import styles from './page.module.css';

const DRAW_TIME_OPTIONS = [
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '120s', value: 120 },
    { label: 'No Limit', value: 0 },
];

const CATEGORY_COLORS = {
    mandible: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    maxilla: { bg: 'rgba(236,72,153,0.12)', color: '#ec4899', border: 'rgba(236,72,153,0.3)' },
    tmj: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    midline: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    other: { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.3)' },
};

function toFiniteNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function normalizePoint(point) {
    if (!point) return null;
    if (Array.isArray(point)) {
        const x = toFiniteNumber(point[0]);
        const y = toFiniteNumber(point[1]);
        return x === null || y === null ? null : [x, y];
    }
    if (typeof point === 'object') {
        const x = toFiniteNumber(point.x ?? point.xPercent ?? point[0]);
        const y = toFiniteNumber(point.y ?? point.yPercent ?? point[1]);
        return x === null || y === null ? null : [x, y];
    }
    return null;
}

function normalizePolygon(points) {
    return (points || []).map(normalizePoint).filter(Boolean);
}

function polygonToSvgPoints(points) {
    return normalizePolygon(points).map(([x, y]) => `${x * 100},${y * 100}`).join(' ');
}

function pointsToPath(points) {
    const normalized = normalizePolygon(points);
    if (!normalized.length) return '';
    const [firstX, firstY] = normalized[0];
    return `M ${firstX * 100} ${firstY * 100} ${normalized.slice(1).map(([x, y]) => `L ${x * 100} ${y * 100}`).join(' ')}`;
}

// IoU-based local evaluation for Mock AI
function evaluateWithMockAI(studentPoly, landmark) {
    const typical = normalizePolygon(landmark.typicalPolygon);
    if (!typical || typical.length < 3 || studentPoly.length < 3) {
        return { isCorrect: false, accuracyScore: 0, feedback: 'Not enough points to evaluate.', overlapAssessment: 'missed', correctPolygon: typical || [] };
    }
    // Centroid distance
    const sCx = studentPoly.reduce((s, p) => s + p[0], 0) / studentPoly.length;
    const sCy = studentPoly.reduce((s, p) => s + p[1], 0) / studentPoly.length;
    const tCx = typical.reduce((s, p) => s + p[0], 0) / typical.length;
    const tCy = typical.reduce((s, p) => s + p[1], 0) / typical.length;
    const dist = Math.sqrt((sCx - tCx) ** 2 + (sCy - tCy) ** 2);

    // Bounding box overlap approximation
    const sBounds = getBounds(studentPoly);
    const tBounds = getBounds(typical);
    const overlap = bboxOverlap(sBounds, tBounds);

    let score = 0;
    // Position score (max 50)
    const posScore = Math.max(0, 50 - dist * 300);
    // Overlap score (max 50)
    const ovrScore = overlap * 50;
    score = Math.round(posScore + ovrScore);
    score = Math.max(0, Math.min(100, score));

    const assessment = score >= 70 ? 'good' : score >= 40 ? 'partial' : dist > 0.15 ? 'missed' : 'poor';
    const isCorrect = score >= 50;

    let feedback = '';
    if (score >= 80) feedback = `Excellent work! You accurately identified the ${landmark.name}. Your polygon closely matches the expected location and shape.`;
    else if (score >= 60) feedback = `Good attempt! You found the general area of the ${landmark.name}, but your outline could be more precise. Try to follow the anatomical boundary more closely.`;
    else if (score >= 40) feedback = `Partial match. You're in the right region for the ${landmark.name}, but the coverage needs improvement. ${landmark.significance}`;
    else feedback = `The drawn area doesn't match the ${landmark.name} location. This landmark is typically found near ${Math.round(tCx*100)}% from left, ${Math.round(tCy*100)}% from top. ${landmark.description}`;

    return { isCorrect, accuracyScore: score, feedback, overlapAssessment: assessment, correctPolygon: typical, positionFeedback: `Distance from center: ${(dist*100).toFixed(1)}%`, shapeFeedback: `Bounding box overlap: ${Math.round(overlap*100)}%`, source: 'mock' };
}

function getBounds(poly) {
    const points = normalizePolygon(poly);
    if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX=1, minY=1, maxX=0, maxY=0;
    points.forEach(p => { const x=p[0],y=p[1]; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; });
    return { minX, minY, maxX, maxY };
}

function bboxOverlap(a, b) {
    const x1 = Math.max(a.minX, b.minX), y1 = Math.max(a.minY, b.minY);
    const x2 = Math.min(a.maxX, b.maxX), y2 = Math.min(a.maxY, b.maxY);
    if (x2 <= x1 || y2 <= y1) return 0;
    const inter = (x2-x1)*(y2-y1);
    const aA = (a.maxX-a.minX)*(a.maxY-a.minY);
    const bA = (b.maxX-b.minX)*(b.maxY-b.minY);
    return inter / (aA + bA - inter);
}

function mirrorPolygon(poly) {
    return normalizePolygon(poly).map(([x, y]) => [1 - x, y]);
}

function scorePolygonMatch(studentPoly, typicalPoly) {
    const student = normalizePolygon(studentPoly);
    const typical = normalizePolygon(typicalPoly);
    if (student.length < 3 || typical.length < 3) return 0;
    const sCx = student.reduce((s, p) => s + p[0], 0) / student.length;
    const sCy = student.reduce((s, p) => s + p[1], 0) / student.length;
    const tCx = typical.reduce((s, p) => s + p[0], 0) / typical.length;
    const tCy = typical.reduce((s, p) => s + p[1], 0) / typical.length;
    const dist = Math.sqrt((sCx - tCx) ** 2 + (sCy - tCy) ** 2);
    const overlap = bboxOverlap(getBounds(student), getBounds(typical));
    const posScore = Math.max(0, 50 - dist * 300);
    const ovrScore = overlap * 50;
    return Math.round(Math.max(0, Math.min(100, posScore + ovrScore)));
}

function isBilateralLandmark(landmark) {
    const name = (landmark?.name || '').toLowerCase();
    if (landmark?.category === 'midline') return false;
    if (/nasal septum|hard palate|incisive foramen|midline/i.test(name)) return false;
    return true;
}

function polygonCentroid(poly) {
    const points = normalizePolygon(poly);
    if (!points.length) return { x: 50, y: 50 };
    return {
        x: points.reduce((s, p) => s + p[0], 0) / points.length * 100,
        y: points.reduce((s, p) => s + p[1], 0) / points.length * 100,
    };
}

function polygonBoundsPct(poly) {
    const points = normalizePolygon(poly);
    if (!points.length) return null;
    const xs = points.map(p => p[0] * 100);
    const ys = points.map(p => p[1] * 100);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY };
}

export default function LandmarkPracticePage() {
    const [image, setImage] = useState(null);
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [currentLandmark, setCurrentLandmark] = useState(null);
    const [usedIds, setUsedIds] = useState([]);
    const [detectedLandmarks, setDetectedLandmarks] = useState([]);
    const [detectedIndex, setDetectedIndex] = useState(0);
    const [drawingPoints, setDrawingPoints] = useState([]);
    const [isPolygonClosed, setIsPolygonClosed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [history, setHistory] = useState([]);
    const [configuredModel, setConfiguredModel] = useState('GOOGLE_AI');
    const [aiSource, setAiSource] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [selectedTime, setSelectedTime] = useState(60);
    const imgRef = useRef(null);
    const svgRef = useRef(null);
    const timerRef = useRef(null);
    const [showGuidance, setShowGuidance] = useState(false);

    useEffect(() => {
        fetch('/api/config/model').then(r => r.json()).then(d => { if (d.activeModel) setConfiguredModel(d.activeModel); }).catch(() => {});
    }, []);

    const handleImage = useCallback((dataUrl) => {
        setImage(dataUrl);
        setResult(null);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        setGameStarted(false);
        setShowGuidance(false);
        setScore({ correct: 0, total: 0 });
        setHistory([]);
        setUsedIds([]);
    }, []);

    const pickRandomLandmark = useCallback(async () => {
        const available = landmarks.filter(l => !usedIds.includes(l.id));
        const pool = available.length > 0 ? available : landmarks;
        if (available.length === 0) setUsedIds([]);

        // If custom model is configured and an image exists, try to get detected landmarks
        if (configuredModel === 'OWN_AI' && image) {
            try {
                const res = await fetch('/api/ml-landmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const detected = (data.landmarks || []).map((d) => {
                        const normalizeName = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
                        const detName = normalizeName(d.name || d.id || '');
                        const matched = landmarks.find(l => normalizeName(l.name) === detName || normalizeName(l.id || '') === detName);

                        const polyPixels = normalizePolygon(d.polygon);
                        const rawLooksLikePercent = polyPixels.length > 0 && polyPixels.every(([x, y]) => x <= 1 && y <= 1);
                        const polyPct = polyPixels.map(([x, y]) => rawLooksLikePercent
                            ? [x, y]
                            : [x / (imgSize.w || 1), y / (imgSize.h || 1)]
                        ).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

                        const lm = matched ? { ...matched } : { id: `det_${detName}`, name: d.name || d.id || 'Detected Landmark', description: d.description || '', category: d.category || 'other' };
                        lm.typicalPolygon = polyPct.length ? polyPct : lm.typicalPolygon;
                        if (polyPct.length) {
                            const cx = polyPct.reduce((s,p)=>s+p[0],0)/polyPct.length;
                            const cy = polyPct.reduce((s,p)=>s+p[1],0)/polyPct.length;
                            lm.typicalPosition = { xPercent: cx, yPercent: cy };
                        }

                        return { detection: d, landmark: lm };
                    }).filter(Boolean);

                    if (detected.length > 0) {
                        // Shuffle detections and limit to max 10
                        const shuffled = detected.sort(() => Math.random() - 0.5);
                        const MAX = 10;
                        const limited = shuffled.slice(0, MAX).map(e => e.landmark);
                        setDetectedLandmarks(limited);
                        setDetectedIndex(0);
                        const first = limited[0];
                        setCurrentLandmark(first);
                        setShowGuidance(false);
                        setDrawingPoints([]);
                        setIsPolygonClosed(false);
                        setResult(null);
                        setAiSource('custom');
                        setTimeLeft(selectedTime);
                        if (timerRef.current) clearInterval(timerRef.current);
                        return first;
                    }
                }
            } catch (err) {
                console.warn('Custom landmark detector unavailable:', err);
            }
        }

        const picked = pool[Math.floor(Math.random() * pool.length)];
        // clear any detected sequence when falling back to random picks
        setDetectedLandmarks([]);
        setDetectedIndex(0);
        setCurrentLandmark(picked);
        setShowGuidance(false);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        setResult(null);
        setAiSource(null);
        setTimeLeft(selectedTime);
        if (timerRef.current) clearInterval(timerRef.current);
        return picked;
    }, [usedIds, selectedTime, configuredModel, image, imgSize]);

    const startPractice = () => {
        (async () => {
            setLoading(true);
            const picked = await pickRandomLandmark();
            // only mark game started if we have a picked landmark
            if (picked) setGameStarted(true);
            setLoading(false);
        })();
    };

    const [isDrawing, setIsDrawing] = useState(false);

    const handleCanvasMouseDown = (e) => {
        if (result || !currentLandmark) return;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        
        const xPct = (e.clientX - rect.left) / rect.width;
        const yPct = (e.clientY - rect.top) / rect.height;
        if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return;

        const clampedX = Math.max(0, Math.min(1, xPct));
        const clampedY = Math.max(0, Math.min(1, yPct));

        setDrawingPoints([[clampedX, clampedY]]);
        setIsPolygonClosed(false);
        setIsDrawing(true);
    };

    const handleCanvasMouseMove = (e) => {
        if (!isDrawing || result || !currentLandmark) return;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        
        const xPct = (e.clientX - rect.left) / rect.width;
        const yPct = (e.clientY - rect.top) / rect.height;
        if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return;

        const clampedX = Math.max(0, Math.min(1, xPct));
        const clampedY = Math.max(0, Math.min(1, yPct));

        setDrawingPoints((prev) => {
            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dist = Math.sqrt((clampedX - last[0]) ** 2 + (clampedY - last[1]) ** 2);
                if (dist < 0.006) return prev;
            }
            return [...prev, [clampedX, clampedY]];
        });
    };

    const handleCanvasMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setDrawingPoints((prev) => {
            if (prev.length >= 3) {
                setIsPolygonClosed(true);
            }
            return prev;
        });
    };

    const handleCanvasTouchStart = (e) => {
        if (result || !currentLandmark || e.touches.length === 0) return;
        const touch = e.touches[0];
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        
        const xPct = (touch.clientX - rect.left) / rect.width;
        const yPct = (touch.clientY - rect.top) / rect.height;
        if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return;

        const clampedX = Math.max(0, Math.min(1, xPct));
        const clampedY = Math.max(0, Math.min(1, yPct));

        setDrawingPoints([[clampedX, clampedY]]);
        setIsPolygonClosed(false);
        setIsDrawing(true);
    };

    const handleCanvasTouchMove = (e) => {
        if (!isDrawing || result || !currentLandmark || e.touches.length === 0) return;
        e.preventDefault(); // Prevent scrolling on touch screens while drawing
        const touch = e.touches[0];
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        
        const xPct = (touch.clientX - rect.left) / rect.width;
        const yPct = (touch.clientY - rect.top) / rect.height;
        if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return;

        const clampedX = Math.max(0, Math.min(1, xPct));
        const clampedY = Math.max(0, Math.min(1, yPct));

        setDrawingPoints((prev) => {
            if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const dist = Math.sqrt((clampedX - last[0]) ** 2 + (clampedY - last[1]) ** 2);
                if (dist < 0.006) return prev;
            }
            return [...prev, [clampedX, clampedY]];
        });
    };

    const undoLastPoint = () => {
        if (isPolygonClosed) { setIsPolygonClosed(false); return; }
        setDrawingPoints(prev => prev.slice(0, -1));
    };

    const clearDrawing = () => {
        setDrawingPoints([]);
        setIsPolygonClosed(false);
    };

    const handleSubmit = async () => {
        if (drawingPoints.length < 3 || !currentLandmark) return;
        if (!isPolygonClosed) setIsPolygonClosed(true);
        setLoading(true);
        let evalResult = null;

        try {
            if (configuredModel === 'GOOGLE_AI') {
                const res = await fetch('/api/gemini-landmark-evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image, landmark: currentLandmark,
                        studentPolygon: drawingPoints,
                        imageWidth: imgSize.w, imageHeight: imgSize.h,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!data.error) { evalResult = { ...data, source: 'gemini' }; }
                }
            } else if (configuredModel === 'OWN_AI') {
                // Try the custom landmark detector, then use the local evaluator for polygon scoring.
                try {
                    const res = await fetch('/api/ml-landmarks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const landmarkCount = data.landmarks?.length || 0;

                        // Try to find the best detected polygon that corresponds to the current landmark (handles bilateral cases)
                        let targetForEval = currentLandmark;
                        try {
                            const detections = (data.landmarks || []).map(d => {
                                const rawPolygon = normalizePolygon(d.polygon);
                                const looksLikePercent = rawPolygon.length > 0 && rawPolygon.every(([x, y]) => x <= 1 && y <= 1);
                                return {
                                    name: d.name || d.id,
                                    polygon: rawPolygon.map(([x, y]) => looksLikePercent
                                        ? [x, y]
                                        : [x / (imgSize.w || 1), y / (imgSize.h || 1)]
                                    ).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)),
                                };
                            });

                            const normalize = (s='') => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
                            const baseName = normalize(currentLandmark.name || currentLandmark.id || '');

                            let candidates = detections.filter(d => normalize(d.name).includes(baseName) || baseName.includes(normalize(d.name)));
                            if (candidates.length === 0) candidates = detections;

                            function centroid(poly){ if(!poly||poly.length===0) return [0.5,0.5]; return [poly.reduce((s,p)=>s+p[0],0)/poly.length, poly.reduce((s,p)=>s+p[1],0)/poly.length]; }
                            const sCent = centroid(drawingPoints);
                            let best = null; let bestDist = Infinity;
                            for (const c of candidates) {
                                const cCent = centroid(c.polygon);
                                const d = Math.hypot(sCent[0]-cCent[0], sCent[1]-cCent[1]);
                                if (d < bestDist) { bestDist = d; best = c; }
                            }

                            if (best && best.polygon && best.polygon.length >= 3) {
                                const detLm = { ...currentLandmark };
                                detLm.typicalPolygon = best.polygon;
                                const cx = best.polygon.reduce((s,p)=>s+p[0],0)/best.polygon.length;
                                const cy = best.polygon.reduce((s,p)=>s+p[1],0)/best.polygon.length;
                                detLm.typicalPosition = { xPercent: cx, yPercent: cy };
                                targetForEval = detLm;
                            }
                        } catch (e) {
                            console.warn('Error matching detections for evaluation:', e);
                        }

                        // For bilateral landmarks, also consider the mirrored polygon and use whichever matches best.
                        if (isBilateralLandmark(currentLandmark) && targetForEval?.typicalPolygon) {
                            const originalPoly = targetForEval.typicalPolygon;
                            const mirroredPoly = mirrorPolygon(originalPoly);
                            const originalScore = scorePolygonMatch(drawingPoints, originalPoly);
                            const mirroredScore = scorePolygonMatch(drawingPoints, mirroredPoly);

                            if (mirroredScore > originalScore) {
                                targetForEval = {
                                    ...targetForEval,
                                    typicalPolygon: mirroredPoly,
                                    typicalPosition: {
                                        xPercent: mirroredPoly.reduce((s, p) => s + p[0], 0) / mirroredPoly.length,
                                        yPercent: mirroredPoly.reduce((s, p) => s + p[1], 0) / mirroredPoly.length,
                                    },
                                };
                            }
                        }

                        const mockResult = evaluateWithMockAI(drawingPoints, targetForEval);
                        evalResult = {
                            ...mockResult,
                            source: 'custom',
                            feedback: mockResult.feedback + (landmarkCount > 0
                                ? ` (Custom model detected ${landmarkCount} landmark(s) to reinforce the anatomical context.)`
                                : ' (Custom model did not return landmark detections for this image.)'),
                        };
                    }
                } catch (err) {
                    console.warn('Custom model unavailable, using mock:', err);
                }
            }
        } catch (err) {
            console.error(`AI evaluation failed (${configuredModel}):`, err);
        }

        // Fallback to Mock AI
        if (!evalResult) {
            evalResult = evaluateWithMockAI(drawingPoints, currentLandmark);
        }

        setAiSource(evalResult.source || 'mock');
        setResult(evalResult);
        setScore(prev => ({
            correct: prev.correct + (evalResult.isCorrect ? 1 : 0),
            total: prev.total + 1,
        }));
        setHistory(prev => [
            { landmark: currentLandmark, score: evalResult.accuracyScore, correct: evalResult.isCorrect },
            ...prev,
        ]);
        setUsedIds(prev => [...prev, currentLandmark.id]);
        setLoading(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleNext = async () => {
        setResult(null);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        // If we have a detected sequence, advance through it
        if (detectedLandmarks && detectedLandmarks.length > 0) {
            const nextIdx = detectedIndex + 1;
            if (nextIdx < detectedLandmarks.length) {
                setDetectedIndex(nextIdx);
                setCurrentLandmark(detectedLandmarks[nextIdx]);
                setShowGuidance(false);
                return;
            } else {
                // End of detected list — finish practice
                setGameStarted(false);
                setCurrentLandmark(null);
                return;
            }
        }

        await pickRandomLandmark();
    };

    const handleSkip = async () => {
        // skip current challenge, do not update score/history
        setResult(null);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        if (detectedLandmarks && detectedLandmarks.length > 0) {
            const nextIdx = detectedIndex + 1;
            if (nextIdx < detectedLandmarks.length) {
                setDetectedIndex(nextIdx);
                setCurrentLandmark(detectedLandmarks[nextIdx]);
                setShowGuidance(false);
                return;
            } else {
                setGameStarted(false);
                setCurrentLandmark(null);
                return;
            }
        }
        await pickRandomLandmark();
    };

    const handleEnd = () => {
        setGameStarted(false);
        setCurrentLandmark(null);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        setResult(null);
        setShowGuidance(false);
        setUsedIds([]);
        setDetectedLandmarks([]);
    };

    const handleRetest = () => {
        if (!result) return;
        // allow user to reattempt the same landmark
        setResult(null);
        setDrawingPoints([]);
        setIsPolygonClosed(false);
        setAiSource(null);
        setTimeLeft(selectedTime);
    };

    const onImgLoad = (e) => { setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight }); };

    const catStyle = currentLandmark ? CATEGORY_COLORS[currentLandmark.category] || CATEGORY_COLORS.other : CATEGORY_COLORS.other;

    // Countdown timer for drawing
    useEffect(() => {
        if (!gameStarted || !currentLandmark || result || selectedTime === 0) return;
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(selectedTime);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Auto-submit if polygon is closed, otherwise mark as timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameStarted, currentLandmark, result]);

    // Handle timeout
    useEffect(() => {
        if (timeLeft === 0 && !result && currentLandmark && gameStarted && selectedTime > 0) {
            if (drawingPoints.length >= 3) {
                if (!isPolygonClosed) setIsPolygonClosed(true);
                handleSubmit();
            } else {
                // Not enough drawing — mark as failed
                const timeoutResult = {
                    isCorrect: false, accuracyScore: 0,
                    feedback: `Time's up! You didn't complete the polygon for ${currentLandmark.name}. ${currentLandmark.description}`,
                    overlapAssessment: 'missed',
                    correctPolygon: currentLandmark.typicalPolygon || [],
                    source: 'timeout',
                };
                setResult(timeoutResult);
                setAiSource('timeout');
                setScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
                setHistory(prev => [{ landmark: currentLandmark, score: 0, correct: false }, ...prev]);
                setUsedIds(prev => [...prev, currentLandmark.id]);
            }
        }
    }, [timeLeft]);

    const scorePercent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const normalizedDrawingPoints = normalizePolygon(drawingPoints);
    const pointsStr = polygonToSvgPoints(normalizedDrawingPoints);
    const pointsPath = pointsToPath(normalizedDrawingPoints) + (isPolygonClosed ? ' Z' : '');
    const guidancePolygon = normalizePolygon(currentLandmark?.typicalPolygon);
    const guidanceCenter = guidancePolygon.length >= 3
        ? polygonCentroid(guidancePolygon)
        : {
            x: Math.min(96, Math.max(4, (currentLandmark?.typicalPosition?.xPercent ?? 0.5) * 100)),
            y: Math.min(96, Math.max(4, (currentLandmark?.typicalPosition?.yPercent ?? 0.5) * 100)),
        };

    // Build correct polygon overlay points
    const correctPolyPoints = polygonToSvgPoints(result?.correctPolygon);

    return (
        <div className={styles.page}>
            <AnimatePresence>{loading && <LoadingOverlay message="AI is evaluating your drawing…" />}</AnimatePresence>

            <div className="container">
                <motion.div className={styles.header} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="section-title">Landmark Drawing Practice</h1>
                    <p className="section-subtitle">
                        Draw anatomical landmarks on OPG radiographs and get AI feedback on your accuracy.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className={styles.modelIndicator}>
                            <div className={styles.blinkingDot} style={{
                                backgroundColor: configuredModel === 'OWN_AI' ? '#22c55e' : configuredModel === 'GOOGLE_AI' ? '#6366f1' : '#f59e0b'
                            }} />
                            {configuredModel === 'OWN_AI' ? <><FiBox size={14} color="#22c55e" /> Custom AI</> :
                             configuredModel === 'GOOGLE_AI' ? <><FiZap size={14} color="#6366f1" /> Gemini AI</> :
                             <><FiCpu size={14} color="#f59e0b" /> Mock AI</>}
                        </div>
                    </div>
                </motion.div>

                {!image ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ maxWidth: 640, margin: '0 auto' }}>
                        <ImageUploader onImageSelect={handleImage} label="Upload OPG for Drawing Practice" />
                        <SampleImages onSelect={handleImage} />
                    </motion.div>
                ) : !gameStarted ? (
                    <motion.div className={styles.startScreen} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className={styles.startIcon}><FiEdit3 size={36} /></div>
                        <h2 className={styles.startTitle}>Ready to Practice?</h2>
                        <p className={styles.startDesc}>
                            You&apos;ll be given a landmark name. Click on the X-ray to draw its polygon outline. AI will evaluate your accuracy.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={startPractice}><FiTarget size={18} /> Start Practice</button>
                            <button className="btn btn-ghost" onClick={() => setImage(null)}>Change Image</button>
                        </div>
                        <div className={styles.timeSelector}>
                            <FiClock size={14} /> Timer:
                            {DRAW_TIME_OPTIONS.map(opt => (
                                <button key={opt.value}
                                    className={`${styles.timeOption} ${selectedTime === opt.value ? styles.timeOptionActive : ''}`}
                                    onClick={() => { setSelectedTime(opt.value); setTimeLeft(opt.value); }}
                                >{opt.label}</button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className={styles.workspace}>
                        {/* Left — Canvas */}
                        <div className={styles.canvasArea}>
                            {/* Challenge Card */}
                            {currentLandmark && (
                                <motion.div className={styles.challengeCard} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={currentLandmark.id}>
                                    <div className={styles.challengeHeader}>
                                        <span className={styles.challengeTitle}><FiTarget size={14} /> Draw This Landmark</span>
                                        <span className={styles.challengeCategory} style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
                                            {landmarkCategories[currentLandmark.category]?.label || currentLandmark.category}
                                        </span>
                                        <button className={`${styles.toolBtn} ${styles.toolBtnSmall}`} onClick={() => setShowGuidance(s => !s)} style={{ marginLeft: 10 }}>
                                            {showGuidance ? 'Hide Guidance' : 'Show Guidance'}
                                        </button>
                                    </div>
                                    <div className={styles.landmarkName}>{currentLandmark.name}</div>
                                    <p className={styles.landmarkHint}>{currentLandmark.description}</p>
                                    {/* Timer */}
                                    {!result && selectedTime > 0 && (
                                        <div className={styles.timerBar}>
                                            <div className={styles.timerBarInner}>
                                                <svg viewBox="0 0 36 36" className={styles.timerSvg}>
                                                    <circle cx="18" cy="18" r="15" stroke="var(--border)" strokeWidth="3" fill="none" />
                                                    <circle cx="18" cy="18" r="15" strokeWidth="3" fill="none" strokeLinecap="round"
                                                        strokeDasharray={2 * Math.PI * 15}
                                                        strokeDashoffset={2 * Math.PI * 15 * (1 - timeLeft / selectedTime)}
                                                        transform="rotate(-90 18 18)"
                                                        stroke={timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#a855f7'}
                                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                                                    />
                                                </svg>
                                                <span className={`${styles.timerText} ${timeLeft <= 10 ? styles.timerDanger : timeLeft <= 20 ? styles.timerWarn : ''}`}>
                                                    {timeLeft}s
                                                </span>
                                            </div>
                                            <div className={styles.timerProgress}>
                                                <motion.div className={styles.timerProgressFill}
                                                    style={{ background: timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : 'var(--gradient-primary)' }}
                                                    animate={{ width: `${(timeLeft / selectedTime) * 100}%` }}
                                                    transition={{ duration: 1, ease: 'linear' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.challengeActions}>
                                        {!result && (
                                            <>
                                            <button className="btn btn-primary" onClick={handleSubmit} disabled={drawingPoints.length < 3 || loading} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                                <FiSend size={16} /> Submit Drawing
                                            </button>
                                            <button className="btn btn-ghost" onClick={handleSkip} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                                <FiSkipForward size={16} /> Skip
                                            </button>
                                            </>
                                        )}
                                        {result && (
                                            <>
                                            <button className="btn btn-primary" onClick={handleNext} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                                <FiSkipForward size={16} /> Next Landmark
                                            </button>
                                            {!result.isCorrect && (
                                                <button className="btn btn-outline" onClick={handleRetest} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                                    Retest
                                                </button>
                                            )}
                                            </>
                                        )}
                                        <button className="btn btn-ghost" onClick={handleEnd} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                            End Practice
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => { setImage(null); setGameStarted(false); }} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                            New Image
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Drawing Toolbar */}
                            {!result && (
                                <div className={styles.drawingToolbar}>
                                    <button className={styles.toolBtn} onClick={undoLastPoint} disabled={drawingPoints.length === 0}>
                                        <FiRotateCcw size={14} /> Undo
                                    </button>
                                    <button className={`${styles.toolBtn} ${styles.toolBtnDanger}`} onClick={clearDrawing} disabled={drawingPoints.length === 0}>
                                        <FiTrash2 size={14} /> Clear
                                    </button>
                                    {drawingPoints.length >= 3 && !isPolygonClosed && (
                                        <button className={styles.toolBtn} onClick={() => setIsPolygonClosed(true)}>
                                            <FiCheck size={14} /> Close Polygon
                                        </button>
                                    )}
                                    <span className={styles.pointCounter}>{drawingPoints.length} points{isPolygonClosed ? ' ✓ closed' : ''}</span>
                                </div>
                            )}

                            {/* Hint */}
                            {!result && drawingPoints.length === 0 && (
                                <div className={styles.drawingHint}>
                                    <FiEdit3 size={16} /> Click on the X-ray to place polygon points. Click near the first point to close.
                                </div>
                            )}

                            {/* Image + SVG Overlay */}
                            <div className={`${styles.imageContainer} ${!result && !isPolygonClosed ? styles.imageContainerDrawing : ''}`}>
                                <img ref={imgRef} src={image} alt="OPG Radiograph" className={styles.radiograph} onLoad={onImgLoad} />
                                <svg ref={svgRef} className={`${styles.drawingOverlay} ${!result && !isPolygonClosed ? styles.drawingCursor : ''}`}
                                    viewBox="0 0 100 100" preserveAspectRatio="none"
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                    onTouchStart={handleCanvasTouchStart}
                                    onTouchMove={handleCanvasTouchMove}
                                    onTouchEnd={handleCanvasMouseUp}
                                >
                                    {/* Student path (masking line) */}
                                    {drawingPoints.length >= 2 && (
                                        <>
                                            <path d={pointsPath}
                                                fill={isPolygonClosed ? "rgba(99,102,241,0.2)" : "none"}
                                                stroke="rgba(99,102,241,0.18)"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                            <path d={pointsPath}
                                                fill={isPolygonClosed ? "rgba(99,102,241,0.2)" : "none"}
                                                stroke="#6366f1"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        </>
                                    )}
                                    {/* Correct polygon overlay after evaluation */}
                                    {result && correctPolyPoints && (
                                        <motion.polygon points={correctPolyPoints}
                                            fill="rgba(34,197,94,0.2)" stroke="#22c55e" strokeWidth="3"
                                            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="4,2"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                        />
                                    )}
                                    {/* Detected landmark guidance overlay (dashed faint) */}
                                    {showGuidance && guidancePolygon.length >= 3 && (
                                        <g style={{ mixBlendMode: 'screen' }} opacity="1">
                                            <polygon points={polygonToSvgPoints(guidancePolygon)}
                                                fill="rgba(34,197,94,0.38)" stroke="#00ff88" strokeWidth="7"
                                                vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="10,5"
                                            />
                                            {guidancePolygon.map((p, i) => (
                                                <circle key={i} cx={p[0] * 100} cy={p[1] * 100} r={i === 0 ? 3.2 : 2.2} fill="#00ff88" stroke="#fff" strokeWidth="0.7" />
                                            ))}
                                            <circle cx={guidanceCenter.x} cy={guidanceCenter.y} r="8" fill="rgba(0,255,136,0.08)" stroke="#d1fae5" strokeWidth="2" strokeDasharray="2,2" />
                                            <circle cx={guidanceCenter.x} cy={guidanceCenter.y} r="2.4" fill="#00ff88" stroke="#fff" strokeWidth="0.6" />
                                            {(() => {
                                                const b = polygonBoundsPct(guidancePolygon);
                                                return (
                                                    <>
                                                        {b && (
                                                            <rect x={b.minX} y={b.minY} width={Math.max(2, b.maxX - b.minX)} height={Math.max(2, b.maxY - b.minY)}
                                                                fill="none" stroke="rgba(0,255,136,0.95)" strokeWidth="2" strokeDasharray="4,3" />
                                                        )}
                                                        <rect x={Math.min(90, guidanceCenter.x + 1)} y={Math.max(2, guidanceCenter.y - 9)} width={Math.min(18, currentLandmark.name.length * 1.7)} height="6"
                                                            rx="1.5" fill="rgba(5,46,22,0.75)" stroke="#00ff88" strokeWidth="0.6" />
                                                        <text x={Math.min(94, guidanceCenter.x + 2)} y={Math.max(6, guidanceCenter.y - 4)} fill="#ecfdf5" fontSize="4.5" fontWeight="900" stroke="#052e16" strokeWidth="0.8" paintOrder="stroke">
                                                            {currentLandmark.name}
                                                        </text>
                                                    </>
                                                );
                                            })()}
                                        </g>
                                    )}
                                    {showGuidance && currentLandmark && guidancePolygon.length < 3 && (
                                        <g style={{ mixBlendMode: 'screen' }} opacity="1">
                                            <circle cx={guidanceCenter.x} cy={guidanceCenter.y} r="9"
                                                fill="rgba(0,255,136,0.12)" stroke="#00ff88" strokeWidth="3.2" />
                                            <circle cx={guidanceCenter.x} cy={guidanceCenter.y} r="2" fill="#00ff88" stroke="#fff" strokeWidth="0.5" />
                                            <text x={Math.min(94, guidanceCenter.x + 2)}
                                                y={Math.max(6, guidanceCenter.y - 2)}
                                                fill="#ecfdf5" fontSize="4.5" fontWeight="900" stroke="#052e16" strokeWidth="0.8" paintOrder="stroke">{currentLandmark.name}</text>
                                        </g>
                                    )}
                                </svg>
                            </div>

                            {/* Legend after evaluation */}
                            {result && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(99,102,241,0.4)', border: '2px solid #6366f1' }} />
                                        Your Drawing
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(34,197,94,0.3)', border: '2px dashed #22c55e' }} />
                                        Correct Location
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Right — Sidebar */}
                        <motion.aside className={styles.sidebar} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            {/* Score Tracker */}
                            <div className={styles.scoreTracker}>
                                <div className={styles.scoreCircle}>
                                    <svg viewBox="0 0 60 60" className={styles.scoreSvg}>
                                        <circle cx="30" cy="30" r="24" stroke="var(--border)" strokeWidth="5" fill="none" />
                                        <motion.circle cx="30" cy="30" r="24" stroke="url(#practiceGrad)" strokeWidth="5" fill="none"
                                            strokeLinecap="round" strokeDasharray={2 * Math.PI * 24}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - scorePercent / 100) }}
                                            transition={{ duration: 0.8 }} transform="rotate(-90 30 30)"
                                        />
                                        <defs>
                                            <linearGradient id="practiceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className={styles.scoreTextWrap}>
                                        <span className={styles.scoreValue}>{scorePercent}%</span>
                                    </div>
                                </div>
                                <div className={styles.scoreDetails}>
                                    <span className={styles.scoreLabel}>{score.correct}/{score.total} Correct</span>
                                    <span className={styles.scoreSub}>{score.total === 0 ? 'No attempts yet' : `${score.total} landmark${score.total > 1 ? 's' : ''} attempted`}</span>
                                </div>
                            </div>

                            {/* Result Card */}
                            <AnimatePresence mode="wait">
                                {result && (
                                    <motion.div key="result"
                                        className={`${styles.resultCard} ${result.accuracyScore >= 70 ? styles.resultCorrect : result.accuracyScore >= 40 ? styles.resultPartial : styles.resultWrong}`}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className={styles.resultHeader}>
                                            <div className={styles.resultIcon} style={{
                                                background: result.accuracyScore >= 70 ? 'rgba(34,197,94,0.15)' : result.accuracyScore >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: result.accuracyScore >= 70 ? '#22c55e' : result.accuracyScore >= 40 ? '#f59e0b' : '#ef4444',
                                            }}>
                                                {result.accuracyScore >= 70 ? <FiCheck size={20} /> : result.accuracyScore >= 40 ? <FiTarget size={20} /> : <FiX size={20} />}
                                            </div>
                                            <div className={styles.resultTitleWrap}>
                                                <div className={styles.resultTitle}>
                                                    {result.accuracyScore >= 70 ? 'Excellent!' : result.accuracyScore >= 40 ? 'Partial Match' : 'Try Again'}
                                                </div>
                                                <div className={styles.resultAccuracy}>Accuracy: {result.accuracyScore}%</div>
                                            </div>
                                        </div>
                                        <div className={styles.accuracyBar}>
                                            <motion.div className={styles.accuracyFill}
                                                style={{ background: result.accuracyScore >= 70 ? '#22c55e' : result.accuracyScore >= 40 ? '#f59e0b' : '#ef4444' }}
                                                initial={{ width: 0 }} animate={{ width: `${result.accuracyScore}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <p className={styles.resultFeedback}>{result.feedback}</p>
                                        <div className={styles.resultMeta}>
                                            {result.overlapAssessment && (
                                                <span className={styles.metaBadge}>Overlap: {result.overlapAssessment}</span>
                                            )}
                                            <span className={styles.metaBadge} style={{
                                                color: aiSource === 'gemini' ? '#818cf8' : aiSource === 'custom' ? '#4ade80' : '#fbbf24',
                                            }}>
                                                {aiSource === 'gemini' ? '⚡ Gemini' : aiSource === 'custom' ? '🔧 Custom AI' : '🖥 Mock AI'}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* History */}
                            {history.length > 0 && (
                                <div className={styles.historySection}>
                                    <h4 className={styles.historyTitle}><FiClock size={14} /> Attempt History</h4>
                                    <div className={styles.historyList}>
                                        {history.map((h, i) => (
                                            <div key={i} className={styles.historyItem}>
                                                <span className={styles.historyIcon} style={{ color: h.correct ? '#22c55e' : '#ef4444' }}>
                                                    {h.correct ? <FiCheck size={14} /> : <FiX size={14} />}
                                                </span>
                                                <span className={styles.historyName}>{h.landmark.name}</span>
                                                <span className={styles.historyScore} style={{
                                                    color: h.score >= 70 ? '#22c55e' : h.score >= 40 ? '#f59e0b' : '#ef4444',
                                                    background: h.score >= 70 ? 'rgba(34,197,94,0.1)' : h.score >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                }}>{h.score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.aside>
                    </div>
                )}
            </div>
        </div>
    );
}
