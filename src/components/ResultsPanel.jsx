'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import styles from './ResultsPanel.module.css';

const severityConfig = {
    low: { icon: FiInfo, color: '#a855f7', label: 'Low' },
    mild: { icon: FiInfo, color: '#22c55e', label: 'Mild' },
    moderate: { icon: FiAlertTriangle, color: '#f59e0b', label: 'Moderate' },
    severe: { icon: FiAlertTriangle, color: '#ef4444', label: 'Severe' },
    normal: { icon: FiCheckCircle, color: '#22c55e', label: 'Normal' },
};

export default function ResultsPanel({ results = [], title = 'Analysis Results', open, onClose }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className={styles.panel}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    >
                        <div className={styles.header}>
                            <h2 className={styles.title}>{title}</h2>
                            <motion.button
                                className={styles.closeBtn}
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FiX size={20} />
                            </motion.button>
                        </div>

                        <div className={styles.body}>
                            {results.length === 0 ? (
                                <p className={styles.empty}>No results to display.</p>
                            ) : (
                                results.map((item, idx) => {
                                    const sev = severityConfig[item.severity] || severityConfig.normal;
                                    const Icon = sev.icon;
                                    return (
                                        <motion.div
                                            key={idx}
                                            className={styles.resultCard}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.06 }}
                                        >
                                            <div className={styles.resultHeader}>
                                                <div className={styles.resultName}>
                                                    <Icon size={18} style={{ color: sev.color }} />
                                                    <span>{item.name}</span>
                                                </div>
                                                {item.confidence != null && (
                                                    <span className={styles.confidence}>{Math.round(item.confidence * 100)}%</span>
                                                )}
                                            </div>
                                            {item.severity && (
                                                <span className={styles.badge} style={{ color: sev.color, borderColor: sev.color }}>
                                                    {sev.label}
                                                </span>
                                            )}
                                            {item.description && (
                                                <p className={styles.desc}>{item.description}</p>
                                            )}
                                            {item.recommendation && (
                                                <p className={styles.rec}>💡 {item.recommendation}</p>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
