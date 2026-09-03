'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import styles from './InstallPrompt.module.css';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Don't show if already dismissed this session
        if (sessionStorage.getItem('pwa-dismissed')) {
            setDismissed(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('pwa-dismissed', '1');
    };

    if (!deferredPrompt || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.banner}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
            >
                <div className={styles.content}>
                    <span className={styles.icon}>🦷</span>
                    <div className={styles.text}>
                        <strong>Install DentalAI</strong>
                        <span>Add to home screen for offline access</span>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button className={styles.installBtn} onClick={handleInstall}>
                        <FiDownload size={16} /> Install
                    </button>
                    <button className={styles.closeBtn} onClick={handleDismiss}>
                        <FiX size={18} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
