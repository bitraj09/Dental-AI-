'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiColumns, FiZap, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import { diagnoseConditions, simulateDelay, getImageSeed } from '@/utils/mockAI';
import styles from './page.module.css';

export default function ComparePage() {
    const [imageA, setImageA] = useState(null);
    const [imageB, setImageB] = useState(null);
    const [resultsA, setResultsA] = useState(null);
    const [resultsB, setResultsB] = useState(null);
    const [isValidXrayA, setIsValidXrayA] = useState(true);
    const [isValidXrayB, setIsValidXrayB] = useState(true);
    const [loading, setLoading] = useState(false);
    const [imgSizeA, setImgSizeA] = useState({ w: 800, h: 400 });
    const [imgSizeB, setImgSizeB] = useState({ w: 800, h: 400 });

    const handleImageA = useCallback((dataUrl) => {
        setImageA(dataUrl); setResultsA(null);
        setIsValidXrayA(true);
    }, []);

    const handleImageB = useCallback((dataUrl) => {
        setImageB(dataUrl); setResultsB(null);
        setIsValidXrayB(true);
    }, []);

    const handleCompare = async () => {
        if (!imageA || !imageB) return;
        setLoading(true);

        // Helper: try Gemini, fallback to mock
        const analyzeImage = async (img, imgSize) => {
            try {
                const res = await fetch('/api/gemini-diagnose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: img, imageWidth: imgSize.w, imageHeight: imgSize.h }),
                });
                if (res.ok) {
                    const data = await res.json();

                    // If Gemini explicitly says it's not a valid OPG, don't fall back to mock
                    if (data.isValidXray === false) {
                        return { results: [], isValid: false };
                    }

                    if (data.findings && !data.error) {
                        return { results: data.findings, isValid: true };
                    }
                }
            } catch (err) {
                console.warn('[Gemini Compare] Falling back:', err);
            }
            // Fallback
            const seed = getImageSeed(img);
            return { results: diagnoseConditions(imgSize.w, imgSize.h, seed), isValid: true };
        };

        const [resA, resB] = await Promise.all([
            analyzeImage(imageA, imgSizeA),
            analyzeImage(imageB, imgSizeB),
        ]);

        setResultsA(resA.results);
        setIsValidXrayA(resA.isValid);
        setResultsB(resB.results);
        setIsValidXrayB(resB.isValid);
        setLoading(false);
    };

    const handleReset = () => {
        setImageA(null); setImageB(null);
        setResultsA(null); setResultsB(null);
    };

    const onLoadA = (e) => setImgSizeA({ w: e.target.naturalWidth || 800, h: e.target.naturalHeight || 400 });
    const onLoadB = (e) => setImgSizeB({ w: e.target.naturalWidth || 800, h: e.target.naturalHeight || 400 });

    const renderFindings = (results) => {
        if (!results) return <div className={styles.noResults}>Analysis pending…</div>;
        return (
            <ul className={styles.findingList}>
                {results.map((r, i) => (
                    <li key={i} className={styles.findingItem}>
                        <span className={styles.dot} style={{ background: r.color }} />
                        <div className={styles.findingInfo}>
                            <strong>{r.name}</strong>
                            <span className={styles.meta}>
                                {r.toothZone} • {r.severity} • {Math.round(r.confidence * 100)}%
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className={styles.page}>
            <AnimatePresence>{loading && <LoadingOverlay message="Analyzing both images…" />}</AnimatePresence>

            <div className="container">
                <motion.div className={styles.header} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="section-title">OPG Image Comparison</h1>
                    <p className="section-subtitle">
                        Upload two panoramic OPG radiographs side-by-side to compare findings — ideal for before/after treatment analysis.
                    </p>
                </motion.div>

                <div className={styles.compareGrid}>
                    {/* Panel A */}
                    <motion.div className={styles.panel} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <h3 className={styles.panelTitle}>Image A (Before)</h3>
                        {!imageA ? (
                            <>
                                <ImageUploader onImageSelect={handleImageA} label="Upload first OPG radiograph" />
                                <SampleImages onSelect={handleImageA} />
                            </>
                        ) : (
                            <div className={styles.preview}>
                                <img src={imageA} alt="Radiograph A" onLoad={onLoadA} />
                                {resultsA && isValidXrayA && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <h4 className={styles.resultsTitle}>Findings ({resultsA.length})</h4>
                                        {renderFindings(resultsA)}
                                    </motion.div>
                                )}
                                {!isValidXrayA && (
                                    <motion.div
                                        className={styles.errorAlert}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <FiAlertTriangle className={styles.errorIcon} size={20} />
                                        <div className={styles.errorContent}>
                                            <span className={styles.errorTitle}>Unsupported Image</span>
                                            <p className={styles.errorText}>This image is not a valid OPG radiograph.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Panel B */}
                    <motion.div className={styles.panel} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <h3 className={styles.panelTitle}>Image B (After)</h3>
                        {!imageB ? (
                            <>
                                <ImageUploader onImageSelect={handleImageB} label="Upload second OPG radiograph" />
                                <SampleImages onSelect={handleImageB} />
                            </>
                        ) : (
                            <div className={styles.preview}>
                                <img src={imageB} alt="Radiograph B" onLoad={onLoadB} />
                                {resultsB && isValidXrayB && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <h4 className={styles.resultsTitle}>Findings ({resultsB.length})</h4>
                                        {renderFindings(resultsB)}
                                    </motion.div>
                                )}
                                {!isValidXrayB && (
                                    <motion.div
                                        className={styles.errorAlert}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <FiAlertTriangle className={styles.errorIcon} size={20} />
                                        <div className={styles.errorContent}>
                                            <span className={styles.errorTitle}>Unsupported Image</span>
                                            <p className={styles.errorText}>This image is not a valid OPG radiograph.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Actions */}
                <motion.div className={styles.actions} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {imageA && imageB && !resultsA && (
                        <button className="btn btn-primary" onClick={handleCompare} disabled={loading}>
                            <FiZap size={18} /> Compare Analysis
                        </button>
                    )}
                    {(imageA || imageB) && (
                        <button className="btn btn-outline" onClick={handleReset}>
                            <FiRefreshCw size={16} /> Reset Both
                        </button>
                    )}
                </motion.div>

                {/* Summary */}
                {resultsA && resultsB && isValidXrayA && isValidXrayB && (
                    <motion.div className={styles.summary} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h3 className={styles.summaryTitle}><FiColumns size={18} /> Comparison Summary</h3>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Image A</div>
                                <div className={styles.summaryNum}>{resultsA.length}</div>
                                <div className={styles.summaryMeta}>conditions found</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Image B</div>
                                <div className={styles.summaryNum}>{resultsB.length}</div>
                                <div className={styles.summaryMeta}>conditions found</div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>Difference</div>
                                <div className={styles.summaryNum} style={{ color: resultsA.length > resultsB.length ? 'var(--success)' : resultsA.length < resultsB.length ? 'var(--danger)' : 'var(--primary)' }}>
                                    {resultsA.length === resultsB.length ? '—' : resultsA.length > resultsB.length ? `↓ ${resultsA.length - resultsB.length}` : `↑ ${resultsB.length - resultsA.length}`}
                                </div>
                                <div className={styles.summaryMeta}>
                                    {resultsA.length > resultsB.length ? 'improvement' : resultsA.length < resultsB.length ? 'more conditions' : 'no change'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
