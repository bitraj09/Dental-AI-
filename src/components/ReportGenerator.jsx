'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPrinter, FiDownload, FiUser } from 'react-icons/fi';
import styles from './ReportGenerator.module.css';

/**
 * Draws a pie chart on a canvas and returns a data URL image.
 * Works entirely without external libs so it renders in the print report.
 */
function drawPieChart(items, width = 320, height = 240) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const cx = 110, cy = height / 2, r = 85;
    const total = items.reduce((s, i) => s + i.value, 0) || 1;

    // Colors
    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];

    let startAngle = -Math.PI / 2;
    items.forEach((item, idx) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        startAngle += sliceAngle;
    });

    // Legend
    const legendX = cx + r + 30;
    let legendY = 30;
    ctx.font = '12px Inter, sans-serif';
    items.forEach((item, idx) => {
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fillRect(legendX, legendY - 8, 12, 12);
        ctx.fillStyle = '#334155';
        ctx.fillText(`${item.label} (${item.value})`, legendX + 18, legendY + 1);
        legendY += 22;
    });

    return canvas.toDataURL('image/png');
}

/**
 * Draws a horizontal bar chart on a canvas and returns a data URL image.
 */
function drawBarChart(items, width = 420, height = 0) {
    const barH = 26, gap = 8, padTop = 20, padLeft = 120, padRight = 40;
    const calcHeight = padTop + items.length * (barH + gap) + 10;
    height = Math.max(height, calcHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxVal = Math.max(...items.map(i => i.value), 1);
    const barAreaW = width - padLeft - padRight;

    items.forEach((item, idx) => {
        const y = padTop + idx * (barH + gap);
        const barW = (item.value / maxVal) * barAreaW;

        // Label
        ctx.fillStyle = '#475569';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item.label.length > 16 ? item.label.slice(0, 16) + '…' : item.label, padLeft - 8, y + barH / 2 + 4);

        // Bar
        const grad = ctx.createLinearGradient(padLeft, y, padLeft + barW, y);
        grad.addColorStop(0, '#a855f7');
        grad.addColorStop(1, '#ec4899');
        ctx.fillStyle = grad;
        roundRect(ctx, padLeft, y, barW, barH, 4);
        ctx.fill();

        // Value label
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'left';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`${item.value}%`, padLeft + barW + 6, y + barH / 2 + 4);
    });

    return canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * ReportGenerator component — generates printable / downloadable HTML report
 * with embedded Chart.js-style charts rendered as canvas images.
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
    const [pieChartUrl, setPieChartUrl] = useState(null);
    const [barChartUrl, setBarChartUrl] = useState(null);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const generatedId = `DAI-${Date.now().toString(36).toUpperCase()}`;

    // Generate charts when data changes
    useEffect(() => {
        if (!data) return;

        if (type === 'diagnosis' && Array.isArray(data)) {
            // Pie chart: condition distribution by severity
            const severityCounts = {};
            data.forEach(f => {
                const s = f.severity || 'unknown';
                severityCounts[s] = (severityCounts[s] || 0) + 1;
            });
            const pieItems = Object.entries(severityCounts).map(([label, value]) => ({
                label: label.charAt(0).toUpperCase() + label.slice(1),
                value,
            }));
            setPieChartUrl(drawPieChart(pieItems));

            // Bar chart: confidence per finding
            const barItems = data.map(f => ({
                label: f.name,
                value: Math.round(f.confidence * 100),
            }));
            setBarChartUrl(drawBarChart(barItems));
        }

        if (type === 'forensics' && data.parameters) {
            // Bar chart: parameter confidence
            const barItems = data.parameters.map(p => ({
                label: p.name,
                value: Math.round(p.confidence * 100),
            }));
            setBarChartUrl(drawBarChart(barItems, 420));

            // Pie chart: parameter weight distribution
            const pieItems = data.parameters.map(p => ({
                label: p.name,
                value: Math.round(p.weight * 100),
            }));
            setPieChartUrl(drawPieChart(pieItems, 360, 260));
        }
    }, [data, type]);

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

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => document.body.removeChild(iframe), 1000);
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
        <motion.div className={styles.wrapper} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {/* Patient info form */}
            <div className={styles.patientForm}>
                <h3 className={styles.formTitle}><FiUser size={16} /> Patient Information <span className={styles.optional}>(optional)</span></h3>
                <div className={styles.formRow}>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Patient Name</label>
                        <input type="text" className={styles.formInput} placeholder="Enter patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>Patient ID</label>
                        <input type="text" className={styles.formInput} placeholder={generatedId} value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
                <motion.button className={`btn btn-primary ${styles.actionBtn}`} onClick={handlePrint} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <FiPrinter size={18} /> Print / Save PDF
                </motion.button>
                <motion.button className={`btn btn-outline ${styles.actionBtn}`} onClick={handleDownload} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
                            {/* Charts Section */}
                            <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
                                {pieChartUrl && (
                                    <div style={{ flex: '1 1 280px' }}>
                                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: '#334155' }}>Severity Distribution</h3>
                                        <img src={pieChartUrl} alt="Severity Distribution" style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }} />
                                    </div>
                                )}
                                {barChartUrl && (
                                    <div style={{ flex: '1 1 320px' }}>
                                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: '#334155' }}>Confidence Scores</h3>
                                        <img src={barChartUrl} alt="Confidence Scores" style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }} />
                                    </div>
                                )}
                            </div>

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

                            {/* Charts Section */}
                            <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
                                {barChartUrl && (
                                    <div style={{ flex: '1 1 320px' }}>
                                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: '#334155' }}>Parameter Confidence</h3>
                                        <img src={barChartUrl} alt="Parameter Confidence" style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }} />
                                    </div>
                                )}
                                {pieChartUrl && (
                                    <div style={{ flex: '1 1 280px' }}>
                                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: '#334155' }}>Weight Distribution</h3>
                                        <img src={pieChartUrl} alt="Weight Distribution" style={{ maxWidth: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#fff' }} />
                                    </div>
                                )}
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
