'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiUser, FiFileText, FiSearch, FiCalendar, FiArrowRight, FiTrash2, FiActivity } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchRecords();
        }
    }, [status]);

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/records');
            const data = await res.json();
            if (data.records) {
                setRecords(data.records);
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(r =>
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner} />
                <p>Loading your medical history...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h1>Patient Case History</h1>
                        <p>Track and manage all your past dental analyses and patient records.</p>
                    </div>
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by patient name or condition..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <FiActivity className={styles.statIcon} />
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{records.length}</span>
                            <span className={styles.statLabel}>Total Analyses</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <FiUser className={styles.statIcon} style={{ color: '#10b981' }} />
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>
                                {new Set(records.map(r => r.patientName)).size}
                            </span>
                            <span className={styles.statLabel}>Unique Patients</span>
                        </div>
                    </div>
                </div>

                <div className={styles.recordsList}>
                    {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, idx) => (
                            <motion.div
                                key={record.id}
                                className={styles.recordCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                            >
                                <div className={styles.recordHeader}>
                                    <div className={styles.patientBadge}>
                                        <FiUser />
                                        <span>{record.patientName}</span>
                                    </div>
                                    <span className={styles.recordDate}>
                                        <FiCalendar size={14} />
                                        {new Date(record.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className={styles.recordMain}>
                                    <div className={styles.recordInfo}>
                                        <div className={styles.typeTag}>
                                            {record.type}
                                        </div>
                                        <h3 className={styles.recordSummary}>{record.summary}</h3>
                                        <div className={styles.findingsPreview}>
                                            {Array.isArray(record.findings) && record.findings.slice(0, 3).map((f, i) => (
                                                <span key={i} className={styles.findingTag}>{f.name}</span>
                                            ))}
                                            {record.findings.length > 3 && (
                                                <span className={styles.moreFindings}>+{record.findings.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                    {record.imageThumbnail && (
                                        <div className={styles.thumbnailWrapper}>
                                            <img src={record.imageThumbnail} alt="Thumbnail" />
                                        </div>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {selectedRecord?.id === record.id && (
                                        <motion.div
                                            className={styles.recordDetails}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailSection}>
                                                    <h4>Full Analysis Findings</h4>
                                                    <div className={styles.findingsList}>
                                                        {record.findings.map((f, i) => (
                                                            <div key={i} className={styles.findingDetailItem}>
                                                                <div className={styles.detailHeader}>
                                                                    <strong>{f.name}</strong>
                                                                    <span className={styles[f.severity]}>{f.severity}</span>
                                                                </div>
                                                                <p>{f.description}</p>
                                                                {f.recommendation && (
                                                                    <p className={styles.rec}>💡 {f.recommendation}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className={styles.recordFooter}>
                                    <span>Click to {selectedRecord?.id === record.id ? 'hide' : 'expand'} details</span>
                                    <FiArrowRight size={16} />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <FiFileText size={48} />
                            <h3>No records found</h3>
                            <p>Once you perform analyses and save them, they will appear here.</p>
                            <button className="btn btn-primary" onClick={() => router.push('/diagnosis')}>
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
