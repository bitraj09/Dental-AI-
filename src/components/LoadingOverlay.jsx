'use client';
import { motion } from 'framer-motion';
import styles from './LoadingOverlay.module.css';

export default function LoadingOverlay({ message = 'Analyzing radiograph…' }) {
    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={styles.content}>
                {/* Tooth scan animation */}
                <div className={styles.toothWrap}>
                    <svg className={styles.tooth} viewBox="0 0 80 100" fill="none">
                        <path
                            d="M20 35C20 20 30 8 40 8C50 8 60 20 60 35C60 50 58 65 55 80C53 88 47 92 40 92C33 92 27 88 25 80C22 65 20 50 20 35Z"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <path
                            d="M33 35C33 30 36 25 40 25C44 25 47 30 47 35"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    <motion.div
                        className={styles.scanLine}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <motion.p
                    className={styles.message}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {message}
                </motion.p>

                <div className={styles.dots}>
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className={styles.dot}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
