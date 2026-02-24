'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiList, FiEye } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import { detectLandmarks, simulateDelay, getImageSeed } from '@/utils/mockAI';
import { landmarkCategories } from '@/data/landmarkData';
import styles from './page.module.css';

export default function LandmarksPage() {
    const [image, setImage] = useState(null);
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLm, setSelectedLm] = useState(null);
    const [showLabels, setShowLabels] = useState(true);
    const [aiSource, setAiSource] = useState(null);
    const imgRef = useRef(null);

    const handleImage = useCallback((dataUrl) => {
        setImage(dataUrl);
        setResults([]);
        setSelectedLm(null);
        setAiSource(null);
    }, []);

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        let detected;
        let source = 'mock';

        // Try Gemini API
        try {
            const res = await fetch('/api/gemini-landmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.landmarks && data.landmarks.length > 0 && !data.error) {
                    detected = data.landmarks;
                    source = 'gemini';
                }
            }
        } catch (err) {
            console.warn('[Gemini Landmarks] Falling back:', err);
        }

        // Fallback to mock AI
        if (!detected) {
            await simulateDelay(2200);
            const seed = getImageSeed(image);
            detected = detectLandmarks(imgSize.w, imgSize.h, seed);
            source = 'mock';
        }

        setAiSource(source);
        setResults(detected);
        setLoading(false);
    };

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

    // Compute display scale
    const getScale = () => {
        if (!imgRef.current || imgSize.w === 0) return { sx: 1, sy: 1 };
        const rect = imgRef.current.getBoundingClientRect();
        return { sx: rect.width / imgSize.w, sy: rect.height / imgSize.h };
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
                    <h1 className="section-title">Landmark Detection</h1>
                    <p className="section-subtitle">
                        Upload a dental radiograph and let AI identify anatomical landmarks with precision.
                    </p>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload OPG Radiograph" />
                        <SampleImages onSelect={handleImage} />
                    </motion.div>
                ) : (
                    <div className={styles.workspace}>
                        {/* Image + Overlay */}
                        <div className={styles.canvasWrap}>
                            <div className={styles.toolbar}>
                                <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || results.length > 0}>
                                    <FiZap size={18} /> {results.length > 0 ? 'Analysis Complete' : 'Detect Landmarks'}
                                </button>
                                {aiSource && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: aiSource === 'gemini' ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)',
                                        color: aiSource === 'gemini' ? '#818cf8' : '#94a3b8',
                                        border: `1px solid ${aiSource === 'gemini' ? 'rgba(99,102,241,0.3)' : 'rgba(100,116,139,0.2)'}`,
                                    }}>
                                        {aiSource === 'gemini' ? '⚡ Gemini AI' : '🖥 Mock AI'}
                                    </span>
                                )}
                                {results.length > 0 && (
                                    <button className={`btn btn-ghost`} onClick={() => setShowLabels(!showLabels)}>
                                        <FiEye size={16} /> {showLabels ? 'Hide' : 'Show'} Labels
                                    </button>
                                )}
                                <button className="btn btn-outline" onClick={() => { setImage(null); setResults([]); setSelectedLm(null); }}>
                                    New Image
                                </button>
                            </div>

                            <div className={styles.imageContainer}>
                                <img
                                    ref={imgRef}
                                    src={image}
                                    alt="Dental radiograph"
                                    className={styles.radiograph}
                                    onLoad={onImgLoad}
                                />
                                {/* Landmark annotations */}
                                {results.map((lm, idx) => {
                                    const { sx, sy } = getScale();
                                    return (
                                        <motion.div
                                            key={lm.id}
                                            className={`${styles.marker} ${selectedLm === lm.id ? styles.markerActive : ''}`}
                                            style={{
                                                left: lm.x * sx,
                                                top: lm.y * sy,
                                                borderColor: lm.color,
                                                boxShadow: `0 0 12px ${lm.color}55`,
                                            }}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.08, type: 'spring' }}
                                            onClick={() => setSelectedLm(selectedLm === lm.id ? null : lm.id)}
                                        >
                                            <span className={styles.markerDot} style={{ background: lm.color }} />
                                            {showLabels && (
                                                <span className={styles.markerLabel} style={{ background: lm.color }}>
                                                    {lm.name}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar */}
                        {results.length > 0 && (
                            <motion.aside
                                className={styles.sidebar}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className={styles.sidebarTitle}>
                                    <FiList size={18} /> Detected Landmarks ({results.length})
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

                                <div className={styles.resultList}>
                                    {results.map((lm, idx) => (
                                        <motion.div
                                            key={lm.id}
                                            className={`${styles.resultItem} ${selectedLm === lm.id ? styles.resultActive : ''}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setSelectedLm(selectedLm === lm.id ? null : lm.id)}
                                        >
                                            <div className={styles.resultHeader}>
                                                <span className={styles.resultDot} style={{ background: lm.color }} />
                                                <span className={styles.resultName}>{lm.name}</span>
                                                <span className={styles.resultConf}>{Math.round(lm.confidence * 100)}%</span>
                                            </div>
                                            <AnimatePresence>
                                                {selectedLm === lm.id && (
                                                    <motion.div
                                                        className={styles.resultDetail}
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                    >
                                                        <p>{lm.description}</p>
                                                        <p className={styles.significance}>📋 {lm.significance}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.aside>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
