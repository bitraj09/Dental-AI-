'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiInfo, FiActivity, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import styles from './page.module.css';

// FDI Universal Numbering System
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Mock data to simulate AI diagnosis
const MOCK_PATIENT_DATA = {
    18: { status: 'impacted', findings: ['Mesioangular impaction'] },
    16: { status: 'restored', findings: ['MOD composite filling'] },
    14: { status: 'restored', findings: ['DO amalgam filling'] },
    24: { status: 'caries', findings: ['Occlusal caries (moderate)'] },
    26: { status: 'endodontic', findings: ['Root canal treated', 'Crown present'] },
    36: { status: 'caries', findings: ['Mesial caries (mild)'], recommendation: 'Composite restoration' },
    38: { status: 'missing', findings: ['Missing (Extracted)'] },
    46: { status: 'healthy', findings: ['Sealant present'] },
    48: { status: 'missing', findings: ['Missing (Extracted)'] },
};

export default function ToothChartPage() {
    const [selectedTooth, setSelectedTooth] = useState(null);

    const getToothStatus = (toothNumber) => {
        return MOCK_PATIENT_DATA[toothNumber]?.status || 'healthy';
    };

    const handleToothClick = (toothNum) => {
        setSelectedTooth(toothNum);
    };

    return (
        <div className={styles.page}>
            <div className="container">
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">Interactive Tooth Chart</h1>
                    <p className="section-subtitle">
                        Comprehensive full-mouth AI analysis using FDI Universal numbering.
                    </p>
                </motion.div>

                <div className={styles.chartLayout}>
                    {/* 32-Tooth Grid */}
                    <div className={styles.chartContainer}>
                        <div className={styles.arch}>
                            <h3 className={styles.archTitle}>Maxillary (Upper) Arch</h3>
                            <div className={styles.toothGridRow}>
                                {UPPER_TEETH.map((tooth) => {
                                    const status = getToothStatus(tooth);
                                    return (
                                        <motion.div
                                            key={tooth}
                                            className={`${styles.toothCell} ${styles[status]} ${selectedTooth === tooth ? styles.selected : ''}`}
                                            onClick={() => handleToothClick(tooth)}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <div className={styles.toothIcon}>🦷</div>
                                            <span className={styles.toothNumber}>{tooth}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.archLine}></div>

                        <div className={styles.arch}>
                            <div className={styles.toothGridRow}>
                                {LOWER_TEETH.map((tooth) => {
                                    const status = getToothStatus(tooth);
                                    return (
                                        <motion.div
                                            key={tooth}
                                            className={`${styles.toothCell} ${styles[status]} ${selectedTooth === tooth ? styles.selected : ''}`}
                                            onClick={() => handleToothClick(tooth)}
                                            whileHover={{ scale: 1.05, y: 2 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className={styles.toothNumber}>{tooth}</span>
                                            <div className={styles.toothIcon}>🦷</div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <h3 className={styles.archTitle}>Mandibular (Lower) Arch</h3>
                        </div>

                        {/* Legend */}
                        <div className={styles.legend}>
                            <div className={styles.legendItem}><span className={`${styles.legendColor} ${styles.bgHealthy}`}></span> Healthy</div>
                            <div className={styles.legendItem}><span className={`${styles.legendColor} ${styles.bgCaries}`}></span> Pathology</div>
                            <div className={styles.legendItem}><span className={`${styles.legendColor} ${styles.bgRestored}`}></span> Restored</div>
                            <div className={styles.legendItem}><span className={`${styles.legendColor} ${styles.bgMissing}`}></span> Missing</div>
                        </div>
                    </div>

                    {/* Side Panel for Tooth Details */}
                    <div className={styles.sidePanel}>
                        <AnimatePresence mode="wait">
                            {selectedTooth ? (
                                <motion.div
                                    key={`tooth-${selectedTooth}`}
                                    className={styles.infoCard}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <div className={styles.cardHeader}>
                                        <h2>Tooth #{selectedTooth}</h2>
                                        <span className={`${styles.statusBadge} ${styles[getToothStatus(selectedTooth)]}`}>
                                            {getToothStatus(selectedTooth).toUpperCase()}
                                        </span>
                                    </div>

                                    <div className={styles.cardBody}>
                                        <div className={styles.infoSection}>
                                            <h4><FiActivity size={16} /> Clinical Findings</h4>
                                            {MOCK_PATIENT_DATA[selectedTooth] ? (
                                                <ul className={styles.findingList}>
                                                    {MOCK_PATIENT_DATA[selectedTooth].findings.map((f, i) => (
                                                        <li key={i}>{f}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className={styles.healthyText}><FiCheckCircle /> Clinically uncompromised. No pathologies detected by AI.</p>
                                            )}
                                        </div>

                                        {MOCK_PATIENT_DATA[selectedTooth]?.recommendation && (
                                            <div className={styles.infoSection}>
                                                <h4><FiAlertCircle size={16} /> Treatment Plan</h4>
                                                <p className={styles.recommendationText}>{MOCK_PATIENT_DATA[selectedTooth].recommendation}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className={styles.emptyState}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <FiInfo size={40} className={styles.emptyIcon} />
                                    <h3>Select a Tooth</h3>
                                    <p>Click on any tooth in the chart to view detailed health findings, AI analysis, and treatment plans.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
