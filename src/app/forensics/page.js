'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiTarget, FiActivity, FiArrowRight, FiDownload, FiClock, FiAlertTriangle, FiSave, FiUser, FiFileText, FiBarChart2 } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import ReportGenerator from '@/components/ReportGenerator';
import { estimateAge, simulateDelay, getImageSeed } from '@/utils/mockAI';
import { useDentalState } from '@/context/DentalStateContext';
import styles from './page.module.css';

export default function ForensicsPage() {
    const {
        forensicsImage: image,
        setForensicsImage,
        resetForensicsImage,
        forensicsState,
        setForensicsState
    } = useDentalState();

    const { result, summary, isValidXray, aiSource } = forensicsState;

    const setResult = (val) => setForensicsState(prev => ({ ...prev, result: typeof val === 'function' ? val(prev.result) : val }));
    const setSummary = (val) => setForensicsState(prev => ({ ...prev, summary: typeof val === 'function' ? val(prev.summary) : val }));
    const setIsValidXray = (val) => setForensicsState(prev => ({ ...prev, isValidXray: typeof val === 'function' ? val(prev.isValidXray) : val }));
    const setAiSource = (val) => setForensicsState(prev => ({ ...prev, aiSource: typeof val === 'function' ? val(prev.aiSource) : val }));

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [patientName, setPatientName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const handleImage = useCallback((dataUrl) => {
        setForensicsImage(dataUrl);
        setForensicsState(prev => ({
            ...prev,
            result: null,
            summary: '',
            isValidXray: true,
            aiSource: null
        }));
        setSaved(false);
        setPatientName('');
    }, [setForensicsImage, setForensicsState]);

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        let estimation;
        let source = 'mock';

        // Try Gemini API
        try {
            const res = await fetch('/api/gemini-forensics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            });
            if (res.ok) {
                const data = await res.json();

                // If it's not a valid OPG, don't fall back to mock
                if (data.isValidXray === false) {
                    setAiSource('gemini');
                    setResult(null);
                    setSummary(data.summary || 'Please upload a valid OPG radiograph.');
                    setIsValidXray(false);
                    setLoading(false);
                    return;
                }

                if (data.result && !data.error) {
                    estimation = data.result;
                    source = 'gemini';
                    setSummary(data.summary || '');
                    setIsValidXray(true);
                }
            }
        } catch (err) {
            console.warn('[Gemini Forensics] Falling back:', err);
        }

        // Fallback to mock AI
        if (!estimation) {
            await simulateDelay(3000);
            const img = new Image();
            img.src = image;
            await new Promise((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
            const aspectRatio = img.width / (img.height || 1);
            if (aspectRatio < 1.5) {
                setAiSource('mock');
                setResult(null);
                setSummary('Unsupported image aspect ratio. The uploaded image does not appear to be a panoramic OPG dental radiograph.');
                setIsValidXray(false);
                setLoading(false);
                return;
            }
            const seed = getImageSeed(image);
            estimation = estimateAge(seed);
            source = 'mock';
        }

        setAiSource(source);
        setResult(estimation);
        setLoading(false);
        setHistory((prev) => [
            {
                date: new Date(),
                estimatedAge: estimation.estimatedAge,
                range: `${estimation.minAge}–${estimation.maxAge}`,
                confidence: estimation.confidence,
                source,
            },
            ...prev.slice(0, 9),
        ]);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        try {
            const findings = result.parameters.map(p => ({
                name: p.name,
                description: p.finding,
                severity: 'info',
            }));
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Forensics',
                    patientName: patientName || 'Untitled Case',
                    findings,
                    summary: summary || `Age estimation: ${result.estimatedAge} years (range: ${result.minAge}–${result.maxAge}).`,
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
                    <h1 className="section-title">OPG Forensic Odontology</h1>
                    <p className="section-subtitle">
                        Estimate age from panoramic OPG radiographs using eruption patterns, root closure, pulp narrowing, and cementum deposition.
                    </p>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload Panoramic OPG for Age Estimation" />
                        <SampleImages onSelect={handleImage} />

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
                             <button className="btn btn-outline" onClick={() => resetForensicsImage()}>
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
                        {/* AI Source Badge */}
                        {aiSource && (
                            <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: aiSource === 'gemini' ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)',
                                    color: aiSource === 'gemini' ? '#818cf8' : '#94a3b8',
                                    border: `1px solid ${aiSource === 'gemini' ? 'rgba(99,102,241,0.3)' : 'rgba(100,116,139,0.2)'}`,
                                }}>
                                    {aiSource === 'gemini' ? '⚡ Gemini AI' : '🖥 Mock AI'}
                                </span>
                            </div>
                        )}

                        {/* Gemini AI Summary */}
                        {summary && aiSource === 'gemini' && isValidXray && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: 16, padding: '12px 16px',
                                    background: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: 10, fontSize: '0.85rem',
                                    color: 'var(--text-secondary)', lineHeight: 1.5,
                                    maxWidth: 640, margin: '16px auto 0'
                                }}
                            >
                                <strong style={{ color: '#818cf8' }}>🤖 Gemini Analysis:</strong> {summary}
                            </motion.div>
                        )}

                        {/* Error Alert for Invalid X-ray */}
                        {summary && !isValidXray && (
                            <motion.div
                                className={styles.errorAlert}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ maxWidth: 640, margin: '24px auto 0' }}
                            >
                                <FiAlertTriangle className={styles.errorIcon} size={20} />
                                <div className={styles.errorContent}>
                                    <span className={styles.errorTitle}>Unsupported Image Detected</span>
                                    <p className={styles.errorText}>{summary}</p>
                                </div>
                            </motion.div>
                        )}

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

                        {/* Save to History */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ marginBottom: 20, padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <input
                                type="text"
                                placeholder="Patient Name"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', minWidth: 200 }}
                            />
                            <button
                                className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                                onClick={handleSave}
                                disabled={saving || saved}
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                <FiSave size={16} /> {saving ? 'Saving...' : saved ? 'Saved to History' : 'Save Analysis'}
                            </button>
                        </motion.div>

                        <div className={styles.resultActions}>
                            <button className="btn btn-primary" onClick={() => { resetForensicsImage(); setShowReport(false); setSaved(false); setPatientName(''); }}>
                                New Analysis
                            </button>
                            <button className="btn btn-outline" onClick={() => { setResult(null); setShowReport(false); setSaved(false); }}>
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
