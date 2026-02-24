'use client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPrinter, FiDownload, FiUser, FiHash } from 'react-icons/fi';
import styles from './ReportGenerator.module.css';

/**
 * Generates a printable / downloadable HTML report.
 * Used by both Diagnosis and Forensics modules.
 *
 * Props:
 * - type: 'diagnosis' | 'forensics'
 * - data: analysis result object
 * - image: base64 data URL of the radiograph
 */
export default function ReportGenerator({ type, data, image }) {
    const reportRef = useRef(null);
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState('');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit',
    });

    const generatedId = `DAI-${Date.now().toString(36).toUpperCase()}`;

    const buildReportHTML = () => {
        const content = reportRef.current;
        if (!content) return null;
        return `<!DOCTYPE html>
<html>
<head>
  <title>DentalAI Report — ${type === 'diagnosis' ? 'Diagnosis' : 'Forensic Age Estimation'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  ${content.innerHTML}
</body>
</html>`;
    };

    const handlePrint = () => {
        const html = buildReportHTML();
        if (!html) return;

        // Use an iframe instead of window.open to avoid popup blocker issues
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        // Wait for content and fonts to load before printing
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                // Clean up after print dialog closes
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
    };

    const handleDownload = () => {
        const html = buildReportHTML();
        if (!html) return;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DentalAI_${type}_report_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            className={styles.wrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            {/* Patient info form */}
            <div className={styles.patientForm}>
                <h3 className={styles.formTitle}><FiUser size={16} /> Patient Information <span className={styles.optional}>(optional)</span></h3>
                <div className={styles.formRow}>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Patient Name</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Enter patient name"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                        />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Patient ID</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder={generatedId}
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
                <motion.button
                    className={`btn btn-primary ${styles.actionBtn}`}
                    onClick={handlePrint}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <FiPrinter size={18} /> Print / Save PDF
                </motion.button>
                <motion.button
                    className={`btn btn-outline ${styles.actionBtn}`}
                    onClick={handleDownload}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <FiDownload size={18} /> Download HTML
                </motion.button>
            </div>

            {/* Report Preview */}
            <div className={styles.reportPreview}>
                <div className={styles.previewLabel}>Report Preview</div>
                <div ref={reportRef} className={styles.reportContent}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #a855f7', paddingBottom: 20, marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#a855f7,#ec4899)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>🦷</div>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>DentalAI</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                            <div>Report Generated</div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{dateStr} • {timeStr}</div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                        {type === 'diagnosis' ? '🏥 Patient Diagnosis Report' : '🔬 Forensic Age Estimation Report'}
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24 }}>
                        {type === 'diagnosis'
                            ? 'AI-assisted analysis of dental radiograph for pathological conditions.'
                            : 'AI-assisted age estimation from dental developmental parameters.'}
                    </p>

                    {/* Patient Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: '#f1f5f9', borderRadius: 8, padding: '16px 20px', marginBottom: 28 }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Patient Name</div>
                            <div style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.85rem' }}>{patientName || 'Not Specified'}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Patient ID</div>
                            <div style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.85rem' }}>{patientId || generatedId}</div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Date</div>
                            <div style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.85rem' }}>{dateStr}</div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '12px 16px', fontSize: '0.75rem', color: '#92400e', marginBottom: 24 }}>
                        ⚠️ <strong>Disclaimer:</strong> This report is generated by an AI system for educational and assistive purposes only. It should not be used as a definitive clinical diagnosis. Always consult a qualified dental professional for final interpretation.
                    </div>

                    {/* Radiograph Image */}
                    {image && (
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <img src={image} alt="Dental Radiograph" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>Uploaded dental radiograph (OPG)</p>
                        </div>
                    )}

                    {/* ── DIAGNOSIS REPORT CONTENT ── */}
                    {type === 'diagnosis' && data && (
                        <>
                            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderLeft: '4px solid #a855f7', paddingLeft: 12 }}>
                                Findings ({data.length} condition{data.length !== 1 ? 's' : ''} detected)
                            </h2>

                            {data.map((finding, idx) => (
                                <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 12, pageBreakInside: 'avoid' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{finding.name}</div>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: '0.8rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 999, fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize',
                                            background: finding.severity === 'severe' ? '#fecaca' : finding.severity === 'moderate' ? '#fef3c7' : '#dcfce7',
                                            color: finding.severity === 'severe' ? '#991b1b' : finding.severity === 'moderate' ? '#92400e' : '#166534',
                                        }}>
                                            {finding.severity}
                                        </span>
                                        <span style={{ color: '#64748b' }}>Confidence: {Math.round(finding.confidence * 100)}%</span>
                                        {finding.toothZone && <span style={{ color: '#64748b' }}>Location: {finding.toothZone}</span>}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 6 }}>{finding.description}</p>
                                    {finding.recommendation && (
                                        <div style={{ fontSize: '0.8rem', color: '#059669', background: '#ecfdf5', padding: '8px 12px', borderRadius: 6, marginTop: 8 }}>
                                            💡 <strong>Recommendation:</strong> {finding.recommendation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {/* ── FORENSICS REPORT CONTENT ── */}
                    {type === 'forensics' && data && (
                        <>
                            {/* Age Result */}
                            <div style={{ textAlign: 'center', padding: 24, background: 'linear-gradient(135deg, rgba(168,85,247,0.05), rgba(236,72,153,0.05))', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
                                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#a855f7' }}>
                                    {data.estimatedAge}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 2 }}>Estimated Age (years)</div>
                                <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 600, marginTop: 8 }}>
                                    Range: {data.minAge} — {data.maxAge} years
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                                    Overall Confidence: {Math.round(data.confidence * 100)}%
                                </div>
                            </div>

                            {/* Parameters */}
                            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, borderLeft: '4px solid #ec4899', paddingLeft: 12 }}>
                                Parameter Breakdown
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                {data.parameters.map((param, idx) => (
                                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, pageBreakInside: 'avoid' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{param.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#059669' }}>Finding: {param.finding}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                            Matched: {param.ageRange} • Confidence: {Math.round(param.confidence * 100)}% • Weight: {Math.round(param.weight * 100)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <p>Generated by DentalAI — AI-Powered Dental Radiograph Analysis System</p>
                        <p style={{ marginTop: 4 }}>This report is for educational and assistive purposes only. Not a substitute for professional clinical evaluation.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
