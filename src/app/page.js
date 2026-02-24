'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { TbDental } from 'react-icons/tb';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { RiStethoscopeLine } from 'react-icons/ri';
import { GoLaw } from 'react-icons/go';
import styles from './page.module.css';

const features = [
  {
    href: '/landmarks',
    icon: TbDental,
    title: 'Landmark Detection',
    desc: 'AI identifies and highlights anatomical landmarks on dental radiographs with precision annotations.',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    delay: 0,
  },
  {
    href: '/education',
    icon: HiOutlineAcademicCap,
    title: 'Student Education',
    desc: 'Interactive quiz mode — identify landmarks on radiographs and get instant AI feedback.',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    delay: 0.1,
  },
  {
    href: '/diagnosis',
    icon: RiStethoscopeLine,
    title: 'Patient Diagnosis',
    desc: 'Detect cavities, impacted teeth, bone loss, and other abnormalities with severity analysis.',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    delay: 0.2,
  },
  {
    href: '/forensics',
    icon: GoLaw,
    title: 'Forensic Odontology',
    desc: 'Estimate age from dental parameters — eruption patterns, root closure, pulp narrowing, and more.',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    delay: 0.3,
  },
];

const stats = [
  { value: '20+', label: 'Landmarks Detected' },
  { value: '10+', label: 'Conditions Identified' },
  { value: '95%', label: 'Analysis Accuracy' },
  { value: '5', label: 'Age Parameters' },
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {/* Animated grid */}
          <div className={styles.grid} />
          {/* Floating orbs */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.orb}
              style={{
                width: 200 + i * 80,
                height: 200 + i * 80,
                left: `${15 + i * 18}%`,
                top: `${10 + (i % 3) * 25}%`,
                background: i % 2 === 0
                  ? 'radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)'
                  : 'radial-gradient(circle, rgba(6,214,160,0.1), transparent 70%)',
              }}
              animate={{
                x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
                y: [0, -20 + i * 5, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className={`container ${styles.heroContent}`}>
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TbDental size={16} />
            AI-Powered Dental Analysis
          </motion.div>

          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Intelligent{' '}
            <span className={styles.heroGradient}>Dental Radiograph</span>{' '}
            Analysis
          </motion.h1>

          <motion.p
            className={styles.heroDesc}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Detect landmarks, diagnose conditions, educate students, and estimate age
            from orthopantomograms — all powered by artificial intelligence.
          </motion.p>

          <motion.div
            className={styles.heroCta}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/landmarks" className="btn btn-primary">
              Get Started <FiArrowRight />
            </Link>
            <Link href="/education" className="btn btn-outline">
              Try the Quiz
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className={`section ${styles.features}`}>
        <div className="container">
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Four Powerful Modules</h2>
            <p className="section-subtitle">
              From clinical diagnosis to forensic analysis — every tool a dental professional needs.
            </p>
          </motion.div>

          <div className={styles.featureGrid}>
            {features.map((feat) => (
              <motion.div
                key={feat.href}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feat.delay, type: 'spring', stiffness: 100 }}
              >
                <Link href={feat.href} className={styles.featureCard}>
                  <div className={styles.featureIcon} style={{ background: feat.gradient }}>
                    <feat.icon size={28} />
                  </div>
                  <h3 className={styles.featureTitle}>{feat.title}</h3>
                  <p className={styles.featureDesc}>{feat.desc}</p>
                  <span className={styles.featureLink}>
                    Explore <FiArrowRight size={16} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={`container ${styles.statsGrid}`}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statCard}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
