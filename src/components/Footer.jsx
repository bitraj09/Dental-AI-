'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TbDental } from 'react-icons/tb';
import { FiGithub } from 'react-icons/fi';
import styles from './Footer.module.css';

export default function Footer() {
    const [year, setYear] = useState(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.footerInner}`}>
                <motion.div
                    className={styles.brand}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className={styles.logoIcon}>
                        <TbDental size={22} />
                    </div>
                    <span className={styles.logoText}>DentalAI</span>
                </motion.div>

                <motion.p
                    className={styles.tagline}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    AI-powered dental radiograph analysis for education, diagnosis &amp; forensics.
                </motion.p>

                <motion.div
                    className={styles.bottom}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <p className={styles.copy}>
                        Made by <span className={styles.team}>BIT Buggy Team</span> &copy; {year} DentalAI
                    </p>
                </motion.div>
            </div>
        </footer>
    );
}
