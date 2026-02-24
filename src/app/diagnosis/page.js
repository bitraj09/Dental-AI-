'use client';
import { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiAlertTriangle, FiFileText, FiClock, FiBox, FiSave, FiZap, FiCpu } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import ResultsPanel from '@/components/ResultsPanel';
import ReportGenerator from '@/components/ReportGenerator';
import { diagnoseConditions, simulateDelay, getImageSeed } from '@/utils/mockAI';
import styles from './page.module.css';

// Dynamic import for Three.js (no SSR)
const ToothViewer3D = lazy(() => import('@/components/ToothViewer3D'));

export default function DiagnosisPage() {
    const [image, setImage] = useState(null);
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [show3D, setShow3D] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [history, setHistory] = useState([]);
    const [aiSource, setAiSource] = useState(null); // 'gemini' | 'mock'
    const [summary, setSummary] = useState('');
    const imgRef = useRef(null);

    const handleImage = useCallback((dataUrl) => {
        setImage(dataUrl);
        setFindings([]);
        setShowReport(false);
        setAiSource(null);
        setSummary('');
    }, []);

    // Try Gemini API first, fall back to mock AI
    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        let results;
        let source = 'mock';

        // Attempt Gemini API
        try {
            const res = await fetch('/api/gemini-diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image,
                    imageWidth: imgSize.w,
                    imageHeight: imgSize.h,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.findings && data.findings.length >= 0 && !data.error) {
                    results = data.findings;
                    source = 'gemini';
                    setSummary(data.summary || '');
                }
            }
        } catch (err) {
            console.warn('[Gemini] API call failed, falling back:', err);
        }

        // Fallback to mock AI
        if (!results) {
            await simulateDelay(2800);
            const seed = getImageSeed(image);
            results = diagnoseConditions(imgSize.w, imgSize.h, seed);
            source = 'mock';
            setSummary('');
        }

        setAiSource(source);
        setFindings(results);
        setLoading(false);
        setPanelOpen(true);
        setHistory((prev) => [
            { date: new Date(), count: results.length, findings: results, source },
            ...prev.slice(0, 9),
        ]);
    };

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

    const getScale = () => {
        if (!imgRef.current || imgSize.w === 0) return { sx: 1, sy: 1 };
        const rect = imgRef.current.getBoundingClientRect();
        return { sx: rect.width / imgSize.w, sy: rect.height / imgSize.h };
    };

    return (
        <div className={styles.page}>
            <AnimatePresence>{loading && <LoadingOverlay message="Scanning for conditions…" />}</AnimatePresence>

            <ResultsPanel
                results={findings.map((f) => ({
                    name: f.name,
                    severity: f.severity,
                    confidence: f.confidence,
                    description: f.description,
                    recommendation: f.recommendation,
                }))}
                title={`Diagnosis Results (${findings.length})`}
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
            />

            <div className="container">
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">Patient Diagnosis</h1>
                    <p className="section-subtitle">
                        Upload a dental radiograph to detect cavities, impacted teeth, bone loss, and other conditions.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem',
                            fontWeight: 600, background: 'rgba(99,102,241,0.1)',
                            color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)',
                        }}>⚡ Powered by Gemini AI</span>
                    </div>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload Radiograph for Diagnosis" />
                        <SampleImages onSelect={handleImage} />

                        {/* History */}
                        {history.length > 0 && (
                            <motion.div
                                className={styles.historySection}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className={styles.historyTitle}><FiClock size={16} /> Recent Analyses</h3>
                                {history.map((h, i) => (
                                    <div key={i} className={styles.historyItem}>
                                        <span className={styles.historyDate}>
                                            {h.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={styles.historyFindings}>
                                            {h.count} condition{h.count !== 1 ? 's' : ''} found
                                        </span>
                                        <span className={styles.historyNames}>
                                            {h.findings.map((f) => f.name).join(', ')}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className={styles.workspace}>
                        <div className={styles.toolbar}>
                            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || findings.length > 0}>
                                <FiSearch size={18} /> {findings.length > 0 ? 'Diagnosis Complete' : 'Run Diagnosis'}
                            </button>
                            {aiSource && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem',
                                    fontWeight: 600, letterSpacing: '0.02em',
                                    background: aiSource === 'gemini' ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)',
                                    color: aiSource === 'gemini' ? '#818cf8' : '#94a3b8',
                                    border: `1px solid ${aiSource === 'gemini' ? 'rgba(99,102,241,0.3)' : 'rgba(100,116,139,0.2)'}`,
                                }}>
                                    {aiSource === 'gemini' ? <FiZap size={12} /> : <FiCpu size={12} />}
                                    {aiSource === 'gemini' ? 'Gemini AI' : 'Mock AI'}
                                </span>
                            )}
                            {findings.length > 0 && (
                                <>
                                    <button className="btn btn-outline" onClick={() => setPanelOpen(true)}>
                                        <FiAlertTriangle size={16} /> View Results ({findings.length})
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setShowReport(!showReport)}
                                    >
                                        <FiFileText size={16} /> {showReport ? 'Hide Report' : 'Generate Report'}
                                    </button>
                                    <button
                                        className={`btn ${show3D ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setShow3D(!show3D)}
                                    >
                                        <FiBox size={16} /> {show3D ? 'Hide 3D' : '3D View'}
                                    </button>
                                </>
                            )}
                            <button className="btn btn-ghost" onClick={() => { setImage(null); setFindings([]); setShowReport(false); }}>
                                New Image
                            </button>
                        </div>

                        <div className={styles.imageContainer}>
                            <img ref={imgRef} src={image} alt="Radiograph" className={styles.radiograph} onLoad={onImgLoad} />

                            {/* Bounding boxes */}
                            {findings.map((f, idx) => {
                                const { sx, sy } = getScale();
                                return (
                                    <motion.div
                                        key={idx}
                                        className={`${styles.bbox} ${hoveredIdx === idx ? styles.bboxActive : ''}`}
                                        style={{
                                            left: f.bbox.x * sx,
                                            top: f.bbox.y * sy,
                                            width: f.bbox.width * sx,
                                            height: f.bbox.height * sy,
                                            borderColor: f.color,
                                            boxShadow: hoveredIdx === idx ? `0 0 20px ${f.color}66` : 'none',
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.15, type: 'spring' }}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                    >
                                        <span className={styles.bboxLabel} style={{ background: f.color }}>
                                            {f.name}
                                        </span>
                                        {hoveredIdx === idx && (
                                            <motion.div
                                                className={styles.bboxTooltip}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <div className={styles.tooltipRow}>
                                                    <span>Severity:</span>
                                                    <span className={styles.tooltipSev} style={{ color: f.color }}>{f.severity}</span>
                                                </div>
                                                <div className={styles.tooltipRow}>
                                                    <span>Confidence:</span>
                                                    <span>{Math.round(f.confidence * 100)}%</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Gemini AI Summary */}
                        {summary && aiSource === 'gemini' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: 16, padding: '12px 16px',
                                    background: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: 10, fontSize: '0.85rem',
                                    color: 'var(--text-secondary)', lineHeight: 1.5,
                                }}
                            >
                                <strong style={{ color: '#818cf8' }}>🤖 Gemini Analysis:</strong> {summary}
                            </motion.div>
                        )}

                        {/* Summary cards */}
                        {findings.length > 0 && (
                            <motion.div
                                className={styles.summaryGrid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {findings.map((f, idx) => (
                                    <motion.div
                                        key={idx}
                                        className={styles.summaryCard}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                        whileHover={{ y: -4 }}
                                    >
                                        <div className={styles.summaryHeader}>
                                            <span className={styles.summaryDot} style={{ background: f.color }} />
                                            <span className={styles.summaryName}>{f.name}</span>
                                        </div>
                                        <span className={styles.summarySev} style={{ color: f.color, borderColor: f.color }}>
                                            {f.severity}
                                        </span>
                                        <p className={styles.summaryRec}>💡 {f.recommendation}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* 3D Tooth Viewer */}
                        {show3D && findings.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ marginTop: 24 }}
                            >
                                <Suspense fallback={<div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading 3D viewer…</div>}>
                                    <ToothViewer3D findings={findings} />
                                </Suspense>
                            </motion.div>
                        )}

                        {/* Report */}
                        <AnimatePresence>
                            {showReport && findings.length > 0 && (
                                <ReportGenerator
                                    type="diagnosis"
                                    data={findings}
                                    image={image}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div >
    );
}
