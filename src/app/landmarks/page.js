'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiList, FiEye, FiEyeOff, FiAlertTriangle, FiSave, FiTag, FiLayers, FiChevronLeft, FiChevronRight, FiGrid } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import { detectLandmarks, simulateDelay, getImageSeed } from '@/utils/mockAI';
import { landmarkCategories } from '@/data/landmarkData';
import { useDentalState } from '@/context/DentalStateContext';
import styles from './page.module.css';

export default function LandmarksPage() {
    const {
        landmarksImage: image,
        setLandmarksImage,
        landmarksImageSize: imgSize,
        setLandmarksImageSize: setImgSize,
        resetLandmarksImage,
        landmarksState,
        setLandmarksState
    } = useDentalState();

    const { results, summary, isValidXray, aiSource } = landmarksState;

    const setResults = (val) => setLandmarksState(prev => ({ ...prev, results: typeof val === 'function' ? val(prev.results) : val }));
    const setSummary = (val) => setLandmarksState(prev => ({ ...prev, summary: typeof val === 'function' ? val(prev.summary) : val }));
    const setIsValidXray = (val) => setLandmarksState(prev => ({ ...prev, isValidXray: typeof val === 'function' ? val(prev.isValidXray) : val }));
    const setAiSource = (val) => setLandmarksState(prev => ({ ...prev, aiSource: typeof val === 'function' ? val(prev.aiSource) : val }));

    const [loading, setLoading] = useState(false);
    const [selectedLm, setSelectedLm] = useState(null);
    const [hoveredLm, setHoveredLm] = useState(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showOutlines, setShowOutlines] = useState(true);
    const [fillOpacity, setFillOpacity] = useState(0.30);
    const [patientName, setPatientName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
    // Navigation: -1 = show all, 0..N = show one at a time
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    const handleImage = useCallback((dataUrl) => {
        setLandmarksImage(dataUrl);
        setLandmarksState(prev => ({
            ...prev,
            results: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        }));
        setSelectedLm(null);
        setHoveredLm(null);
        setSaved(false);
        setPatientName('');
        setCurrentIdx(0);
        setViewMode('single');
    }, [setLandmarksImage, setLandmarksState]);

    const handleSave = async () => {
        if (!results || results.length === 0) return;
        setSaving(true);
        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Landmarks',
                    patientName: patientName || 'Untitled Case',
                    findings: results.map(r => ({ name: r.name, description: r.description })),
                    summary: summary || `Reference landmarks detected on OPG radiograph.`,
                    imageThumbnail: image,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSaved(true);
            } else {
                console.error('Save failed:', res.status, data);
                alert(`Failed to save: ${data.error || 'Unknown error'}. Please make sure you are logged in.`);
            }
        } catch (err) {
            console.error('Failed to save record:', err);
            alert('Failed to save record. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        let detected;
        let source = 'mock';

        // ── 1. Try YOLO landmark model (denatlyolo.pt) first ─────────────────
        try {
            const res = await fetch('/api/ml-landmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.isValidXray === false) {
                    setAiSource('yolo');
                    setResults([]);
                    setSummary(data.summary || 'Please upload a valid OPG radiograph.');
                    setIsValidXray(false);
                    setLoading(false);
                    return;
                }
                if (data.landmarks && data.landmarks.length > 0 && !data.error) {
                    detected = data.landmarks;
                    source = 'yolo';
                    setSummary(data.summary || `Custom AI detected ${data.landmarks.length} landmark(s).`);
                    setIsValidXray(true);
                    console.log('[YOLO Landmarks] Success:', data.landmarks.length, 'structures');
                } else {
                    console.warn('[YOLO Landmarks] No detections, falling back to Gemini.');
                }
            } else {
                const err = await res.json().catch(() => ({}));
                console.warn('[YOLO Landmarks] Service error:', err.error || res.status);
            }
        } catch (err) {
            console.warn('[YOLO Landmarks] Not reachable, falling back to Gemini:', err.message);
        }

        // ── 2. Fallback: Gemini API ───────────────────────────────────────────
        if (!detected) {
            try {
                const res = await fetch('/api/gemini-landmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
                });
                if (res.ok) {
                    const data = await res.json();

                    if (data.isValidXray === false) {
                        setAiSource('gemini');
                        setResults([]);
                        setSummary(data.summary || 'Please upload a valid OPG radiograph.');
                        setIsValidXray(false);
                        setLoading(false);
                        return;
                    }

                    if (data.landmarks && data.landmarks.length > 0 && !data.error) {
                        detected = data.landmarks;
                        source = 'gemini';
                        setSummary(data.summary || '');
                        setIsValidXray(true);
                    }
                }
            } catch (err) {
                console.warn('[Gemini Landmarks] Falling back to mock:', err);
            }
        }

        // ── 3. Final fallback: mock AI ────────────────────────────────────────
        if (!detected) {
            await simulateDelay(2200);
            let w = imgSize.w;
            let h = imgSize.h;
            if (w === 0) {
                const img = new Image();
                img.src = image;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                w = img.width;
                h = img.height;
            }
            const aspectRatio = w / (h || 1);
            if (aspectRatio < 1.5) {
                setAiSource('mock');
                setResults([]);
                setSummary('Unsupported image aspect ratio. The uploaded image does not appear to be a panoramic OPG dental radiograph.');
                setIsValidXray(false);
                setLoading(false);
                return;
            }
            const seed = getImageSeed(image);
            detected = detectLandmarks(w, h, seed);
            source = 'mock';
        }

        setAiSource(source);
        setResults(detected);
        setCurrentIdx(0);
        setViewMode('single');
        setLoading(false);
        setSaved(false);
    };

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

    // Track display size for SVG overlay
    useEffect(() => {
        const updateDisplaySize = () => {
            if (imgRef.current) {
                const rect = imgRef.current.getBoundingClientRect();
                setDisplaySize({ w: rect.width, h: rect.height });
            }
        };

        updateDisplaySize();
        window.addEventListener('resize', updateDisplaySize);
        return () => window.removeEventListener('resize', updateDisplaySize);
    }, [image, results]);

    // Ensure currentIdx is valid if results are loaded
    useEffect(() => {
        if (results && results.length > 0) {
            if (currentIdx < 0 || currentIdx >= results.length) {
                setCurrentIdx(0);
            }
        }
    }, [results, currentIdx]);

    // Navigation handlers
    const goNext = () => {
        if (results.length === 0) return;
        setCurrentIdx((prev) => {
            const current = prev >= 0 && prev < results.length ? prev : 0;
            return (current + 1) % results.length;
        });
    };

    const goPrev = () => {
        if (results.length === 0) return;
        setCurrentIdx((prev) => {
            const current = prev >= 0 && prev < results.length ? prev : 0;
            return (current - 1 + results.length) % results.length;
        });
    };

    const toggleViewMode = () => {
        setViewMode((prev) => prev === 'single' ? 'all' : 'single');
    };

    // Which landmarks to render
    const validIdx = currentIdx >= 0 && currentIdx < results.length ? currentIdx : 0;
    const visibleResults = viewMode === 'all' ? results : (results.length > 0 ? [results[validIdx]] : []);
    const currentLandmark = results.length > 0 ? results[validIdx] : null;

    // Compute scale factors
    const getScale = () => {
        if (imgSize.w === 0 || displaySize.w === 0) return { sx: 1, sy: 1 };
        return { sx: displaySize.w / imgSize.w, sy: displaySize.h / imgSize.h };
    };

    // Convert polygon to SVG points string
    const polygonToPoints = (polygon, sx, sy) => {
        return polygon.map(p => `${p.x * sx},${p.y * sy}`).join(' ');
    };

    // Get hex color with alpha
    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    return (
        <div className={styles.page}>
            <AnimatePresence>{loading && <LoadingOverlay message="Detecting landmarks…" />}</AnimatePresence>

            <div className="container">
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">OPG Landmark Detection</h1>
                    <p className="section-subtitle">
                        Upload a panoramic OPG radiograph and let AI identify anatomical landmarks with polygon mask overlays.
                    </p>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload Panoramic OPG for Landmarks" />
                        <SampleImages onSelect={handleImage} />
                    </motion.div>
                ) : (
                    <div className={styles.workspace}>
                        {/* Image + SVG Overlay */}
                        <div className={styles.canvasWrap}>
                            <div className={styles.toolbar}>
                                <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || results.length > 0}>
                                    <FiZap size={18} /> {results.length > 0 ? 'Analysis Complete' : 'Run Detection'}
                                </button>
                                {aiSource && (
                                    <span className={styles.aiBadge} style={{
                                        background:
                                            aiSource === 'yolo'   ? 'rgba(16,185,129,0.15)' :
                                            aiSource === 'gemini' ? 'rgba(99,102,241,0.15)' :
                                            'rgba(100,116,139,0.15)',
                                        color:
                                            aiSource === 'yolo'   ? '#34d399' :
                                            aiSource === 'gemini' ? '#818cf8' :
                                            '#94a3b8',
                                        border: `1px solid ${
                                            aiSource === 'yolo'   ? 'rgba(16,185,129,0.35)' :
                                            aiSource === 'gemini' ? 'rgba(99,102,241,0.3)'  :
                                            'rgba(100,116,139,0.2)'
                                        }`,
                                    }}>
                                        {aiSource === 'yolo'   ? '🎯 Custom AI' :
                                         aiSource === 'gemini' ? '⚡ Gemini AI'  :
                                         '🖥 Mock AI'}
                                    </span>
                                )}
                                {results.length > 0 && (
                                    <>
                                        <button className={`btn btn-ghost`} onClick={() => setShowOutlines(!showOutlines)}>
                                            {showOutlines ? <FiEye size={16} /> : <FiEyeOff size={16} />} Outlines
                                        </button>
                                        <button className={`btn btn-ghost`} onClick={() => setShowLabels(!showLabels)}>
                                            <FiTag size={16} /> {showLabels ? 'Hide' : 'Show'} Labels
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-ghost" onClick={() => { resetLandmarksImage(); setPatientName(''); setSaved(false); }}>
                                    New Image
                                </button>
                            </div>

                            {/* Navigation Bar — One by One Controls */}
                            {results.length > 0 && (
                                <motion.div
                                    className={styles.navBar}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {/* Prev / Next buttons */}
                                    <div className={styles.navButtons}>
                                        <button
                                            className={styles.navBtn}
                                            onClick={goPrev}
                                            disabled={viewMode === 'all'}
                                            title="Previous annotation"
                                        >
                                            <FiChevronLeft size={20} />
                                        </button>

                                        <div className={styles.navInfo}>
                                            {viewMode === 'single' ? (
                                                <>
                                                    <span
                                                        className={styles.navColorDot}
                                                        style={{ background: currentLandmark?.color || '#888' }}
                                                    />
                                                    <span className={styles.navLabel}>
                                                        {currentLandmark?.name || '—'}
                                                    </span>
                                                    <span className={styles.navCounter}>
                                                        {currentIdx + 1} / {results.length}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className={styles.navLabel}>
                                                    Showing All ({results.length} structures)
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            className={styles.navBtn}
                                            onClick={goNext}
                                            disabled={viewMode === 'all'}
                                            title="Next annotation"
                                        >
                                            <FiChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Show All / Single toggle */}
                                    <button
                                        className={`${styles.viewToggle} ${viewMode === 'all' ? styles.viewToggleActive : ''}`}
                                        onClick={toggleViewMode}
                                    >
                                        <FiGrid size={14} /> {viewMode === 'all' ? 'One by One' : 'Show All'}
                                    </button>

                                    {/* Opacity control */}
                                    <div className={styles.opacityControl}>
                                        <FiLayers size={14} />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Math.round(fillOpacity * 100)}
                                            onChange={(e) => setFillOpacity(parseInt(e.target.value) / 100)}
                                            className={styles.opacitySlider}
                                        />
                                        <span className={styles.opacityValue}>{Math.round(fillOpacity * 100)}</span>
                                    </div>
                                </motion.div>
                            )}

                            {results.length > 0 && isValidXray && (
                                <motion.div
                                    className={styles.saveAction}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Patient Name"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className={styles.patientInput}
                                    />
                                    <button
                                        className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                                        onClick={handleSave}
                                        disabled={saving || saved}
                                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                    >
                                        <FiSave size={16} /> {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                                    </button>
                                </motion.div>
                            )}

                            <div className={styles.imageContainer} ref={containerRef}>
                                <img
                                    ref={imgRef}
                                    src={image}
                                    alt="Dental radiograph"
                                    className={styles.radiograph}
                                    onLoad={(e) => {
                                        onImgLoad(e);
                                        setTimeout(() => {
                                            if (imgRef.current) {
                                                const rect = imgRef.current.getBoundingClientRect();
                                                setDisplaySize({ w: rect.width, h: rect.height });
                                            }
                                        }, 50);
                                    }}
                                />

                                {/* SVG Polygon Overlay */}
                                {results.length > 0 && displaySize.w > 0 && showOutlines && (
                                    <svg
                                        className={styles.svgOverlay}
                                        viewBox={`0 0 ${displaySize.w} ${displaySize.h}`}
                                        preserveAspectRatio="none"
                                    >
                                        <AnimatePresence>
                                            {visibleResults.map((lm) => {
                                                const { sx, sy } = getScale();
                                                if (!lm.polygon || lm.polygon.length < 3) return null;

                                                const points = polygonToPoints(lm.polygon, sx, sy);
                                                const isSelected = selectedLm === lm.id;
                                                const isHovered = hoveredLm === lm.id;
                                                const isHighlighted = isSelected || isHovered;
                                                const isSingleView = viewMode === 'single';
                                                const textWidth = Math.min(lm.name.length * 6.2 + 16, 220);

                                                // Dynamic opacity/width for PACS-style clean rendering
                                                const strokeOpacity = isHighlighted || isSingleView ? 1.0 : 0.35;
                                                const strokeWidth = isHighlighted || isSingleView ? 2.5 : 1.0;
                                                const currentFillOpacity = isHighlighted || isSingleView
                                                    ? Math.min(fillOpacity + 0.15, 0.6)
                                                    : 0.03; // extremely subtle fill when not focused

                                                return (
                                                    <g key={lm.id}>
                                                        {/* Outer glow stroke */}
                                                        {(isHighlighted || isSingleView) && (
                                                            <polygon
                                                                points={points}
                                                                fill="none"
                                                                stroke={lm.color}
                                                                strokeWidth={5}
                                                                strokeLinejoin="round"
                                                                opacity={0.45}
                                                                style={{ transition: 'all 0.2s ease', pointerEvents: 'none' }}
                                                            />
                                                        )}

                                                        {/* Main Fill and Inner stroke */}
                                                        <polygon
                                                            points={points}
                                                            fill={hexToRgba(lm.color, currentFillOpacity)}
                                                            stroke={lm.color}
                                                            strokeWidth={strokeWidth}
                                                            strokeOpacity={strokeOpacity}
                                                            strokeLinejoin="round"
                                                            className={styles.polygonShape}
                                                            onMouseEnter={() => setHoveredLm(lm.id)}
                                                            onMouseLeave={() => setHoveredLm(null)}
                                                            onClick={() => setSelectedLm(selectedLm === lm.id ? null : lm.id)}
                                                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                        />

                                                        {/* Label on polygon - only shown when single view or active/highlighted */}
                                                        {showLabels && (isHighlighted || isSingleView) && (
                                                            <g style={{ pointerEvents: 'none' }}>
                                                                <rect
                                                                    x={lm.centerX * sx - (textWidth / 2)}
                                                                    y={lm.centerY * sy - 9}
                                                                    width={textWidth}
                                                                    height={18}
                                                                    rx={4}
                                                                    fill="rgba(11, 7, 20, 0.88)"
                                                                    stroke={lm.color}
                                                                    strokeWidth={1.5}
                                                                />
                                                                <text
                                                                    x={lm.centerX * sx}
                                                                    y={lm.centerY * sy + 3}
                                                                    fill="#ffffff"
                                                                    fontSize="10"
                                                                    fontWeight="700"
                                                                    fontFamily="Inter, system-ui, sans-serif"
                                                                    textAnchor="middle"
                                                                >
                                                                    {lm.name}
                                                                </text>
                                                            </g>
                                                        )}
                                                    </g>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        {(results.length > 0 || (summary && !isValidXray)) && (
                            <motion.aside
                                className={styles.sidebar}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className={styles.sidebarTitle}>
                                    <FiList size={18} /> Detected Structures ({results.length})
                                </h3>

                                {/* Category legend */}
                                <div className={styles.legend}>
                                    {Object.entries(landmarkCategories).map(([key, cat]) => (
                                        <span key={key} className={styles.legendItem} style={{ color: cat.color }}>
                                            <span className={styles.legendDot} style={{ background: cat.color }} />
                                            {cat.label}
                                        </span>
                                    ))}
                                </div>

                                {/* Error Alert for Invalid X-ray */}
                                {summary && !isValidXray && (
                                    <motion.div
                                        className={styles.errorAlert}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ marginBottom: 20 }}
                                    >
                                        <FiAlertTriangle className={styles.errorIcon} size={20} />
                                        <div className={styles.errorContent}>
                                            <span className={styles.errorTitle}>Unsupported Image</span>
                                            <p className={styles.errorText}>{summary}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {results.length > 0 ? (
                                    <div className={styles.resultList}>
                                        {results.map((lm, idx) => {
                                            const isActive = viewMode === 'single' && currentIdx === idx;
                                            const isVisible = viewMode === 'all' || currentIdx === idx;

                                            return (
                                                <div
                                                    key={lm.id}
                                                    className={`${styles.resultItem} ${isActive ? styles.resultActive : ''} ${hoveredLm === lm.id ? styles.resultHovered : ''} ${!isVisible ? styles.resultDimmed : ''}`}
                                                    onClick={() => {
                                                        setCurrentIdx(idx);
                                                        setViewMode('single');
                                                        setSelectedLm(lm.id);
                                                    }}
                                                    onMouseEnter={() => setHoveredLm(lm.id)}
                                                    onMouseLeave={() => setHoveredLm(null)}
                                                >
                                                    <div className={styles.resultHeader}>
                                                        <span className={styles.resultIndex}>{idx + 1}</span>
                                                        <span
                                                            className={styles.resultColorSwatch}
                                                            style={{ background: lm.color }}
                                                        />
                                                        <span className={styles.resultName}>{lm.name}</span>
                                                        <span className={styles.resultConf}>{Math.round(lm.confidence * 100)}%</span>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isActive && (
                                                            <motion.div
                                                                className={styles.resultDetail}
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                            >
                                                                <p>{lm.description}</p>
                                                                <p className={styles.significance}>{lm.significance}</p>
                                                                <div className={styles.resultMeta}>
                                                                    <span className={styles.resultCategory}>{lm.category}</span>
                                                                    <span className={styles.resultPoints}>{lm.polygon?.length || 0} pts</span>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    !loading && isValidXray && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Click analyze to detect landmarks.</p>
                                )}
                            </motion.aside>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

