'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { onModelStatus, getModelStatus, loadModel } from '@/utils/mlEngine';
import styles from './ModelStatus.module.css';

/**
 * Shows ML model loading progress and status.
 * Starts loading the model on mount.
 */
export default function ModelStatus({ autoLoad = false }) {
    const [status, setStatus] = useState(getModelStatus());

    useEffect(() => {
        const unsub = onModelStatus(setStatus);
        if (autoLoad) loadModel();
        return unsub;
    }, [autoLoad]);

    const handleLoad = () => loadModel();

    const icon = {
        idle: <FiCpu size={16} />,
        loading: <FiLoader size={16} className={styles.spin} />,
        ready: <FiCheck size={16} />,
        error: <FiAlertCircle size={16} />,
    }[status.status];

    const label = {
        idle: 'AI Model (Click to Load)',
        loading: `Loading Model… ${status.progress}%`,
        ready: 'AI Model Ready',
        error: 'Model Failed — Using Mock AI',
    }[status.status];

    return (
        <motion.button
            className={`${styles.badge} ${styles[status.status]}`}
            onClick={status.status === 'idle' ? handleLoad : undefined}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ cursor: status.status === 'idle' ? 'pointer' : 'default' }}
        >
            {icon}
            <span className={styles.label}>{label}</span>
            {status.status === 'loading' && (
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}
        </motion.button>
    );
}
