'use client';
import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiAlertTriangle, FiFileText, FiClock, FiBox, FiSave, FiZap, FiCpu } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import SampleImages from '@/components/SampleImages';
import LoadingOverlay from '@/components/LoadingOverlay';
import ResultsPanel from '@/components/ResultsPanel';
import ReportGenerator from '@/components/ReportGenerator';
import { diagnoseConditions, simulateDelay, getImageSeed } from '@/utils/mockAI';
import { useDentalState } from '@/context/DentalStateContext';
import styles from './page.module.css';

// Dynamic import for Three.js (no SSR)
const ToothViewer3D = lazy(() => import('@/components/ToothViewer3D'));

export default function DiagnosisPage() {
    const {
        diagnosisImage: image,
        setDiagnosisImage,
        diagnosisImageSize: imgSize,
        setDiagnosisImageSize: setImgSize,
        resetDiagnosisImage,
        diagnosisState,
        setDiagnosisState
    } = useDentalState();

    const { findings, summary, isValidXray, aiSource } = diagnosisState;

    const setFindings = (val) => setDiagnosisState(prev => ({ ...prev, findings: typeof val === 'function' ? val(prev.findings) : val }));
    const setSummary = (val) => setDiagnosisState(prev => ({ ...prev, summary: typeof val === 'function' ? val(prev.summary) : val }));
    const setIsValidXray = (val) => setDiagnosisState(prev => ({ ...prev, isValidXray: typeof val === 'function' ? val(prev.isValidXray) : val }));
    const setAiSource = (val) => setDiagnosisState(prev => ({ ...prev, aiSource: typeof val === 'function' ? val(prev.aiSource) : val }));

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [show3D, setShow3D] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [history, setHistory] = useState([]);
    const [patientName, setPatientName] = useState('');
    const [configuredModel, setConfiguredModel] = useState('GOOGLE_AI');
    const imgRef = useRef(null);

    // Fetch the active model configured in Admin panel
    useEffect(() => {
        fetch('/api/config/model')
            .then(res => res.json())
            .then(data => {
                if (data.activeModel) setConfiguredModel(data.activeModel);
            })
            .catch(err => console.error("Failed to fetch model config", err));
    }, []);

    const handleImage = useCallback((dataUrl) => {
        setDiagnosisImage(dataUrl);
        setDiagnosisState(prev => ({
            ...prev,
            findings: [],
            summary: '',
            isValidXray: true,
            aiSource: null
        }));
        setShowReport(false);
    }, [setDiagnosisImage, setDiagnosisState]);

    // Analyze based on configured model
    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        let results;
        let source = configuredModel;
        let localSummary = '';

        try {
            if (configuredModel === 'OWN_AI') {
                // Call the real ML model (FastAPI Python backend)
                const res = await fetch('/api/ml-diagnose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.isValidXray === false) {
                        setAiSource('OWN_AI');
                        setFindings([]);
                        setSummary(data.summary || 'Please upload a valid OPG radiograph.');
                        setIsValidXray(false);
                        setLoading(false);
                        return;
                    }
                    if (data.findings && !data.error) {
                        results = data.findings;
                        setIsValidXray(true);
                        source = 'OWN_AI';
                        localSummary = `Detected ${results.length} condition(s) using Custom AI model.`;
                    } else if (data.error) {
                        throw new Error(`Custom model error: ${data.error}`);
                    }
                } else {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`Custom ML service returned ${res.status}. Make sure the FastAPI server is running on port 8001. ${errText}`);
                }
            } else if (configuredModel === 'GOOGLE_AI') {
                // Attempt Gemini API
                const res = await fetch('/api/gemini-diagnose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image, imageWidth: imgSize.w, imageHeight: imgSize.h }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.isValidXray === false) {
                        setAiSource('GOOGLE_AI');
                        setFindings([]);
                        setSummary(data.summary || 'Please upload a valid OPG radiograph.');
                        setIsValidXray(false);
                        setLoading(false);
                        return; // Stop here
                    }
                    if (data.findings && !data.error) {
                        results = data.findings;
                        setIsValidXray(true);
                        source = 'GOOGLE_AI';
                        localSummary = data.summary || '';
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to analyze via ${configuredModel}:`, err);
            // For custom model, show the error to the user instead of silently falling back
            if (configuredModel === 'OWN_AI') {
                setIsValidXray(false);
                setSummary(`❌ Custom model unreachable: ${err.message}`);
                setLoading(false);
                return;
            }
        }

        // Fallback or explicit Mock AI
        if (!results || configuredModel === 'MOCK_AI') {
            if (configuredModel !== 'MOCK_AI') console.log(`Falling back from ${configuredModel} to Mock AI...`);
            await simulateDelay(1500);
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
                setAiSource('MOCK_AI');
                setFindings([]);
                setSummary('Unsupported image aspect ratio. The uploaded image does not appear to be a panoramic OPG dental radiograph.');
                setIsValidXray(false);
                setLoading(false);
                return;
            }
            const seed = getImageSeed(image);
            results = diagnoseConditions(w, h, seed);
            source = 'MOCK_AI';
            localSummary = configuredModel === 'MOCK_AI' ? 'Simulated response from Mock AI.' : 'Fallback: Simulated response.';
        }
        
        setAiSource(source);
        setSummary(localSummary);
        setFindings(results);
        setLoading(false);
        setPanelOpen(true);
        setHistory((prev) => [
            { date: new Date(), count: results.length, findings: results, source },
            ...prev.slice(0, 9),
        ]);
        setSaved(false);
    };

    const handleSave = async () => {
        if (!findings || findings.length === 0) return;
        setSaving(true);
        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Diagnosis',
                    patientName: patientName || 'Untitled Case',
                    findings: findings,
                    summary: summary || `Analysis found ${findings.length} dental condition(s).`,
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

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

    const getScale = () => {
        if (!imgRef.current || imgSize.w === 0) return { sx: 1, sy: 1 };
        const rect = imgRef.current.getBoundingClientRect();
        return { sx: rect.width / imgSize.w, sy: rect.height / imgSize.h };
    };

    const groupedFindings = findings.reduce((acc, finding, idx) => {
        const zone = finding.toothZone || 'Unspecified Region';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push({ ...finding, originalIndex: idx });
        return acc;
    }, {});

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
                    <h1 className="section-title">OPG Diagnosis Analysis</h1>
                    <p className="section-subtitle">
                        Upload a panoramic OPG radiograph to detect cavities, impacted teeth, bone loss, and other conditions.
                    </p>
                    
                    {/* Blinking Indicator for Configured Model */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem',
                            fontWeight: 600, background: 'var(--surface-light)',
                            color: 'var(--text-primary)', border: '1px solid var(--border-color)',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <div className={styles.blinkingDot} style={{
                                backgroundColor: configuredModel === 'OWN_AI' ? '#22c55e' : configuredModel === 'GOOGLE_AI' ? '#6366f1' : '#f59e0b'
                            }} />
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {configuredModel === 'OWN_AI' ? <FiBox size={14} color="#22c55e" /> : configuredModel === 'GOOGLE_AI' ? <FiZap size={14} color="#6366f1" /> : <FiCpu size={14} color="#f59e0b" />}
                                {configuredModel === 'OWN_AI' ? 'Custom AI Active' : configuredModel === 'GOOGLE_AI' ? 'Google Gemini Active' : 'Mock AI Active'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload Panoramic OPG for Diagnosis" />
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
                                    background: aiSource === 'GOOGLE_AI' ? 'rgba(99,102,241,0.15)' : aiSource === 'OWN_AI' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                                    color: aiSource === 'GOOGLE_AI' ? '#818cf8' : aiSource === 'OWN_AI' ? '#4ade80' : '#fbbf24',
                                    border: `1px solid ${aiSource === 'GOOGLE_AI' ? 'rgba(99,102,241,0.3)' : aiSource === 'OWN_AI' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                                }}>
                                    {aiSource === 'GOOGLE_AI' ? <FiZap size={12} /> : aiSource === 'OWN_AI' ? <FiBox size={12} /> : <FiCpu size={12} />}
                                    {aiSource === 'GOOGLE_AI' ? 'Gemini AI' : aiSource === 'OWN_AI' ? 'Custom AI' : 'Mock AI'}
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
                            <button className="btn btn-ghost" onClick={() => { resetDiagnosisImage(); setShowReport(false); setPatientName(''); setSaved(false); }}>
                                New Image
                            </button>
                        </div>

                        {findings.length > 0 && isValidXray && (
                            <motion.div
                                className={styles.saveAction}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={styles.inputGroup}>
                                    <input
                                        type="text"
                                        placeholder="Enter Patient Name (Optional)"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className={styles.patientInput}
                                    />
                                </div>
                                <button
                                    className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                                    onClick={handleSave}
                                    disabled={saving || saved}
                                >
                                    <FiSave size={16} /> {saving ? 'Saving...' : saved ? 'Saved to History' : 'Save Analysis'}
                                </button>
                            </motion.div>
                        )}

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

                        {/* Summary */}
                        {summary && isValidXray && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: 16, padding: '12px 16px',
                                    background: aiSource === 'GOOGLE_AI' ? 'rgba(99,102,241,0.08)' : aiSource === 'OWN_AI' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                                    border: `1px solid ${aiSource === 'GOOGLE_AI' ? 'rgba(99,102,241,0.2)' : aiSource === 'OWN_AI' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                    borderRadius: 10, fontSize: '0.85rem',
                                    color: 'var(--text-secondary)', lineHeight: 1.5,
                                }}
                            >
                                <strong style={{ color: aiSource === 'GOOGLE_AI' ? '#818cf8' : aiSource === 'OWN_AI' ? '#4ade80' : '#fbbf24' }}>
                                    {aiSource === 'GOOGLE_AI' ? '🤖 Gemini Analysis: ' : aiSource === 'OWN_AI' ? '🤖 Custom AI: ' : '🤖 Mock AI: '}
                                </strong> 
                                {summary}
                            </motion.div>
                        )}

                        {/* Error Alert for Invalid X-ray */}
                        {summary && !isValidXray && (
                            <motion.div
                                className={styles.errorAlert}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <FiAlertTriangle className={styles.errorIcon} size={20} />
                                <div className={styles.errorContent}>
                                    <span className={styles.errorTitle}>Unsupported Image Detected</span>
                                    <p className={styles.errorText}>{summary}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Per-Tooth Health Reports */}
                        {findings.length > 0 && (
                            <motion.div
                                className={styles.perToothGrid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {Object.entries(groupedFindings).map(([zone, zoneFindings], zoneIdx) => (
                                    <div key={zoneIdx} className={styles.toothReportCard}>
                                        <div className={styles.toothReportHeader}>
                                            <h3 className={styles.toothZoneTitle}>🦷 {zone}</h3>
                                            <span className={styles.toothConditionCount}>
                                                {zoneFindings.length} Finding{zoneFindings.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className={styles.toothReportBody}>
                                            {zoneFindings.map((f) => (
                                                <motion.div
                                                    key={f.originalIndex}
                                                    className={styles.toothFindingItem}
                                                    onMouseEnter={() => setHoveredIdx(f.originalIndex)}
                                                    onMouseLeave={() => setHoveredIdx(null)}
                                                >
                                                    <div className={styles.findingTop}>
                                                        <div className={styles.findingNameWrapper}>
                                                            <span className={styles.findingDot} style={{ background: f.color }} />
                                                            <span className={styles.findingName}>{f.name}</span>
                                                        </div>
                                                        <span className={styles.findingSeverity} style={{ color: f.color, borderColor: `${f.color}40`, backgroundColor: `${f.color}15` }}>
                                                            {f.severity}
                                                        </span>
                                                    </div>
                                                    <p className={styles.findingRec}>⚡ {f.recommendation}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
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
