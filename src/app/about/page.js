'use client';
import { motion } from 'framer-motion';
import { FiCpu, FiLayers, FiShield, FiGlobe, FiCode, FiDatabase, FiMonitor, FiBox } from 'react-icons/fi';
import { TbDental, TbBrain } from 'react-icons/tb';
import styles from './page.module.css';

const techStack = [
    { icon: FiMonitor, name: 'Next.js 15', desc: 'React framework with App Router' },
    { icon: FiCode, name: 'React 19', desc: 'UI component library' },
    { icon: FiBox, name: 'Three.js', desc: '3D tooth visualization' },
    { icon: TbBrain, name: 'TensorFlow.js', desc: 'Browser-based ML inference' },
    { icon: FiLayers, name: 'Fabric.js', desc: 'Canvas manipulation' },
    { icon: FiDatabase, name: 'Firebase', desc: 'Auth & cloud storage' },
];

const features = [
    { icon: TbDental, title: 'Landmark Detection', desc: 'AI-powered identification of 20+ anatomical landmarks on dental panoramic radiographs with precise positioning.' },
    { icon: FiCpu, title: 'Patient Diagnosis', desc: 'Automated detection of cavities, impacted teeth, bone loss, periapical lesions, and other abnormalities.' },
    { icon: FiShield, title: 'Forensic Odontology', desc: 'Age estimation using dental development parameters — eruption patterns, root closure, pulp chamber analysis.' },
    { icon: FiGlobe, title: 'Student Education', desc: 'Interactive quiz system for dental students to practice landmark identification on radiographs.' },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AboutPage() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Hero */}
                <motion.section className={styles.hero} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={styles.heroIcon}><TbDental size={42} /></div>
                    <h1 className="section-title">About DentalAI</h1>
                    <p className={styles.heroDesc}>
                        DentalAI is an AI-powered dental radiograph analysis platform designed for education,
                        clinical diagnosis, and forensic odontology. Built as a comprehensive tool for dental professionals,
                        students, and researchers.
                    </p>
                </motion.section>

                {/* Methodology */}
                <motion.section className={styles.section} initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                    <motion.h2 className={styles.sectionTitle} variants={fadeUp}>Methodology</motion.h2>
                    <motion.div className={styles.methodCard} variants={fadeUp}>
                        <p>
                            The application uses a simulated AI engine that mirrors the behavior of real dental ML models.
                            Analysis is based on anatomically-accurate parameters derived from published dental research:
                        </p>
                        <ul className={styles.methodList}>
                            <li><strong>Landmark Detection:</strong> 20 anatomical landmarks positioned according to standard OPG anatomy with Gaussian confidence scoring.</li>
                            <li><strong>Diagnosis:</strong> Conditions placed in anatomically-correct tooth zones using zone-condition affinity mapping with severity weighting.</li>
                            <li><strong>Age Estimation:</strong> Based on clinical parameters — tooth eruption (Demirjian), root development (Nolla), pulp chamber analysis (Kvaal), and cementum annulation.</li>
                            <li><strong>Deterministic Results:</strong> A seeded pseudo-random number generator (Mulberry32) ensures the same image always produces identical results.</li>
                        </ul>
                        <div className={styles.methodNote}>
                            <strong>Note:</strong> Currently using a mock AI engine for demonstration. The architecture is designed to seamlessly swap in real ML models (TensorFlow.js or ONNX.js) when available.
                        </div>
                    </motion.div>
                </motion.section>

                {/* Features */}
                <motion.section className={styles.section} initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                    <motion.h2 className={styles.sectionTitle} variants={fadeUp}>Core Modules</motion.h2>
                    <motion.div className={styles.featureGrid} variants={stagger}>
                        {features.map((f, i) => (
                            <motion.div key={i} className={styles.featureCard} variants={fadeUp}>
                                <div className={styles.featureIcon}><f.icon size={24} /></div>
                                <h3 className={styles.featureTitle}>{f.title}</h3>
                                <p className={styles.featureDesc}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.section>

                {/* Tech stack */}
                <motion.section className={styles.section} initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
                    <motion.h2 className={styles.sectionTitle} variants={fadeUp}>Technology Stack</motion.h2>
                    <motion.div className={styles.techGrid} variants={stagger}>
                        {techStack.map((t, i) => (
                            <motion.div key={i} className={styles.techCard} variants={fadeUp}>
                                <t.icon size={22} className={styles.techIcon} />
                                <strong>{t.name}</strong>
                                <span className={styles.techDesc}>{t.desc}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.section>

                {/* Disclaimer */}
                <motion.section className={styles.disclaimer} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <h3>⚕️ Disclaimer</h3>
                    <p>
                        DentalAI is a demonstration and educational tool. It should not be used for actual clinical diagnosis
                        or forensic case analysis. All results are simulated and do not constitute medical advice.
                        Always consult a qualified dental professional for patient care.
                    </p>
                </motion.section>
            </div>
        </div>
    );
}
