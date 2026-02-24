'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiUser, FiBarChart2, FiFileText, FiClock } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ReportGenerator from '@/components/ReportGenerator';
import { estimateAge, simulateDelay, getImageSeed } from '@/utils/mockAI';
import styles from './page.module.css';

export default function ForensicsPage() {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [history, setHistory] = useState([]);

    const handleImage = useCallback((dataUrl) => {
        setImage(dataUrl);
        setResult(null);
        setShowReport(false);
    }, []);

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);
        await simulateDelay(3000);
        const seed = getImageSeed(image);
        const estimation = estimateAge(seed);
        setResult(estimation);
        setLoading(false);
        // Save to history
        setHistory((prev) => [
            {
                date: new Date(),
                estimatedAge: estimation.estimatedAge,
                range: `${estimation.minAge}–${estimation.maxAge}`,
                confidence: estimation.confidence,
            },
            ...prev.slice(0, 9),
        ]);
    };

    const agePercent = result ? Math.min(100, (result.estimatedAge / 80) * 100) : 0;

    return (
        <div className={styles.page}>
            <AnimatePresence>{loading && <LoadingOverlay message="Estimating age from dental parameters…" />}</AnimatePresence>

            <div className="container">
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">Forensic Odontology</h1>
                    <p className="section-subtitle">
                        Estimate age from dental radiographs using eruption patterns, root closure, pulp narrowing, and cementum deposition.
                    </p>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload Radiograph for Age Estimation" />

                        {/* History */}
                        {history.length > 0 && (
                            <motion.div
                                className={styles.historySection}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className={styles.historyTitle}><FiClock size={16} /> Recent Estimations</h3>
                                {history.map((h, i) => (
                                    <div key={i} className={styles.historyItem}>
                                        <span className={styles.historyDate}>
                                            {h.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={styles.historyAge}>
                                            Age: <strong>{h.estimatedAge}</strong> yrs ({h.range})
                                        </span>
                                        <span className={styles.historyConf}>
                                            {Math.round(h.confidence * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                ) : !result ? (
                    <motion.div
                        className={styles.analyzeWrap}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className={styles.previewSmall}>
                            <img src={image} alt="Radiograph" />
                        </div>
                        <div className={styles.analyzeActions}>
                            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
                                <FiActivity size={18} /> Estimate Age
                            </button>
                            <button className="btn btn-outline" onClick={() => setImage(null)}>
                                Change Image
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Results */
                    <motion.div
                        className={styles.results}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Age card */}
                        <motion.div
                            className={styles.ageCard}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring' }}
                        >
                            <div className={styles.ageVisual}>
                                <svg viewBox="0 0 200 200" className={styles.ageSvg}>
                                    <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border)" strokeWidth="12" />
                                    <motion.circle
                                        cx="100" cy="100" r="85"
                                        fill="none"
                                        stroke="url(#ageGrad)"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 85}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - agePercent / 100) }}
                                        transition={{ duration: 2, ease: 'easeOut' }}
                                        transform="rotate(-90 100 100)"
                                    />
                                    <defs>
                                        <linearGradient id="ageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className={styles.ageText}>
                                    <FiUser size={20} className={styles.ageIcon} />
                                    <motion.span
                                        className={styles.ageValue}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        {result.estimatedAge}
                                    </motion.span>
                                    <span className={styles.ageUnit}>years</span>
                                </div>
                            </div>

                            <div className={styles.ageInfo}>
                                <h2 className={styles.ageTitle}>Estimated Age</h2>
                                <div className={styles.ageRange}>
                                    <span className={styles.rangeLabel}>Range:</span>
                                    <span className={styles.rangeValue}>{result.minAge} — {result.maxAge} years</span>
                                </div>
                                <div className={styles.ageConf}>
                                    <span className={styles.rangeLabel}>Confidence:</span>
                                    <div className={styles.confBar}>
                                        <motion.div
                                            className={styles.confFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.confidence * 100}%` }}
                                            transition={{ duration: 1, delay: 0.3 }}
                                        />
                                    </div>
                                    <span className={styles.confValue}>{Math.round(result.confidence * 100)}%</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Parameter breakdown */}
                        <motion.div
                            className={styles.paramSection}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className={styles.paramTitle}>
                                <FiBarChart2 size={18} /> Parameter Breakdown
                            </h3>

                            <div className={styles.paramGrid}>
                                {result.parameters.map((param, idx) => (
                                    <motion.div
                                        key={param.id}
                                        className={styles.paramCard}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                    >
                                        <div className={styles.paramHeader}>
                                            <h4 className={styles.paramName}>{param.name}</h4>
                                            <span className={styles.paramWeight}>{Math.round(param.weight * 100)}% weight</span>
                                        </div>
                                        <p className={styles.paramDesc}>{param.description}</p>
                                        <div className={styles.paramFinding}>
                                            <span className={styles.findingLabel}>Finding:</span>
                                            <span className={styles.findingValue}>{param.finding}</span>
                                        </div>
                                        <div className={styles.paramRange}>
                                            <span className={styles.findingLabel}>Matched Range:</span>
                                            <span className={styles.paramBadge}>{param.ageRange}</span>
                                        </div>
                                        <div className={styles.paramConfBar}>
                                            <motion.div
                                                className={styles.paramConfFill}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${param.confidence * 100}%` }}
                                                transition={{ duration: 0.8, delay: 0.6 + idx * 0.1 }}
                                            />
                                            <span className={styles.paramConfText}>{Math.round(param.confidence * 100)}%</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <div className={styles.resultActions}>
                            <button className="btn btn-primary" onClick={() => { setImage(null); setResult(null); setShowReport(false); }}>
                                New Analysis
                            </button>
                            <button className="btn btn-outline" onClick={() => { setResult(null); setShowReport(false); }}>
                                Re-Analyze
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowReport(!showReport)}
                            >
                                <FiFileText size={16} /> {showReport ? 'Hide Report' : 'Generate Report'}
                            </button>
                        </div>

                        {/* Report */}
                        <AnimatePresence>
                            {showReport && (
                                <ReportGenerator
                                    type="forensics"
                                    data={result}
                                    image={image}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
