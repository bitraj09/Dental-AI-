'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiChevronRight, FiLoader } from 'react-icons/fi';
import sampleRadiographs, { loadSampleImage } from '@/data/sampleImages';
import styles from './SampleImages.module.css';

/**
 * A grid of real sample radiograph thumbnails.
 * Click one to load it as a data URL into the parent module.
 */
export default function SampleImages({ onSelect }) {
    const [loadingId, setLoadingId] = useState(null);

    const handleClick = async (sample) => {
        setLoadingId(sample.id);
        try {
            const dataUrl = await loadSampleImage(sample.src);
            onSelect(dataUrl);
        } catch (err) {
            console.error('Failed to load sample:', err);
        }
        setLoadingId(null);
    };

    return (
        <motion.div
            className={styles.wrapper}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <h3 className={styles.title}>
                <FiImage size={16} /> Or try a sample radiograph
            </h3>
            <div className={styles.grid}>
                {sampleRadiographs.map((sample, idx) => (
                    <motion.button
                        key={sample.id}
                        className={styles.card}
                        onClick={() => handleClick(sample)}
                        disabled={loadingId !== null}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                        <div className={styles.thumb}>
                            <img src={sample.src} alt={sample.name} />
                        </div>
                        <div className={styles.info}>
                            <span className={styles.name}>{sample.name}</span>
                            <span className={styles.desc}>{sample.description}</span>
                        </div>
                        {loadingId === sample.id ? (
                            <FiLoader className={`${styles.arrow} ${styles.spin}`} />
                        ) : (
                            <FiChevronRight className={styles.arrow} />
                        )}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
