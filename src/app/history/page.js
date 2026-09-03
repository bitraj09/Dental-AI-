'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiUser, FiFileText, FiSearch, FiCalendar, FiArrowRight, FiTrash2, FiActivity, FiDownload, FiAlertTriangle } from 'react-icons/fi';
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
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchRecords();
        }
    }, [status]);

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/records', { cache: 'no-store' });
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

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRecords((prev) => prev.filter((r) => r.id !== id));
                setConfirmDeleteId(null);
                if (selectedRecord?.id === id) setSelectedRecord(null);
            } else {
                const data = await res.json();
                alert(`Failed to delete: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete record');
        } finally {
            setDeletingId(null);
        }
    };

    const exportAsJSON = () => {
        const dataStr = JSON.stringify(records, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dental-records-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportAsCSV = () => {
        if (records.length === 0) return;

        const headers = ['ID', 'Patient Name', 'Type', 'Summary', 'Date', 'Findings Count'];
        const rows = records.map(r => [
            r.id,
            `"${r.patientName}"`,
            r.type,
            `"${r.summary.replace(/"/g, '""')}"`,
            new Date(r.createdAt).toLocaleDateString('en-IN'),
            Array.isArray(r.findings) ? r.findings.length : 0,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dental-records-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
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
                    <div className={styles.headerActions}>
                        <div className={styles.searchBar}>
                            <FiSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by patient name or condition..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {records.length > 0 && (
                            <div className={styles.exportButtons}>
                                <button className="btn btn-outline" onClick={exportAsJSON} title="Export as JSON" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                                    <FiDownload size={14} /> JSON
                                </button>
                                <button className="btn btn-outline" onClick={exportAsCSV} title="Export as CSV" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                                    <FiDownload size={14} /> CSV
                                </button>
                            </div>
                        )}
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
                    <div className={styles.statCard}>
                        <FiFileText className={styles.statIcon} style={{ color: '#a855f7' }} />
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>
                                {records.filter(r => r.type === 'Diagnosis').length}
                            </span>
                            <span className={styles.statLabel}>Diagnoses</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <FiClock className={styles.statIcon} style={{ color: '#f59e0b' }} />
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>
                                {records.filter(r => r.type === 'Forensics').length}
                            </span>
                            <span className={styles.statLabel}>Forensics</span>
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
                                layout
                            >
                                <div className={styles.recordHeader}>
                                    <div className={styles.patientBadge}>
                                        <FiUser />
                                        <span>{record.patientName}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span className={styles.recordDate}>
                                            <FiCalendar size={14} />
                                            {new Date(record.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </span>

                                        {/* Delete button */}
                                        {confirmDeleteId === record.id ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className={styles.deleteConfirmBtn}
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                                    disabled={deletingId === record.id}
                                                >
                                                    {deletingId === record.id ? '...' : 'Yes, Delete'}
                                                </button>
                                                <button
                                                    className={styles.deleteCancelBtn}
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(record.id); }}
                                                title="Delete record"
                                            >
                                                <FiTrash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={styles.recordMain}
                                    onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.recordInfo}>
                                        <div className={styles.typeTag}>
                                            {record.type}
                                        </div>
                                        <h3 className={styles.recordSummary}>{record.summary}</h3>
                                        <div className={styles.findingsPreview}>
                                            {Array.isArray(record.findings) && record.findings.slice(0, 3).map((f, i) => (
                                                <span key={i} className={styles.findingTag}>{f.name}</span>
                                            ))}
                                            {Array.isArray(record.findings) && record.findings.length > 3 && (
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
                                                        {Array.isArray(record.findings) && record.findings.map((f, i) => (
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

                                <div
                                    className={styles.recordFooter}
                                    onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span>Click to {selectedRecord?.id === record.id ? 'hide' : 'expand'} details</span>
                                    <FiArrowRight size={16} style={{ transform: selectedRecord?.id === record.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
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
