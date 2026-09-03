'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiXCircle, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function PendingApprovalContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const isRejected = searchParams.get('status') === 'rejected';
    const [reapplying, setReapplying] = useState(false);
    const [reapplied, setReapplied] = useState(false);

    const handleReapply = async () => {
        setReapplying(true);
        try {
            const res = await fetch('/api/reapply', { method: 'POST' });
            if (res.ok) {
                setReapplied(true);
            }
        } catch (err) {
            console.error('Reapply failed:', err);
        } finally {
            setReapplying(false);
        }
    };

    return (
        <div className={styles.page}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
                {isRejected ? (
                    <>
                        <motion.div
                            className={styles.iconWrapperRejected}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                        >
                            <FiXCircle size={48} />
                        </motion.div>

                        <h1 className={styles.title}>Registration Rejected</h1>
                        <p className={styles.subtitle}>
                            Unfortunately, your registration was not approved by the admin.
                            This may be due to an invalid college ID or incomplete information.
                        </p>

                        {!reapplied ? (
                            <div className={styles.actions}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleReapply}
                                    disabled={reapplying}
                                >
                                    <FiRefreshCw size={16} className={reapplying ? styles.spinning : ''} />
                                    {reapplying ? 'Submitting...' : 'Re-apply for Approval'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: '/' })}>
                                    <FiLogOut size={16} /> Sign Out
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                className={styles.successMessage}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p>✅ Your re-application has been submitted! The admin will review it again.</p>
                                <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: '/' })} style={{ marginTop: 12 }}>
                                    <FiLogOut size={16} /> Sign Out
                                </button>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <>
                        <motion.div
                            className={styles.iconWrapper}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                        >
                            <FiClock size={48} />
                        </motion.div>

                        <h1 className={styles.title}>Awaiting Approval</h1>
                        <p className={styles.subtitle}>
                            Your registration is being reviewed by the admin.
                            You&apos;ll be able to access all features once approved.
                        </p>

                        {session?.user && (
                            <div className={styles.userInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Name</span>
                                    <span className={styles.infoValue}>{session.user.name}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Email</span>
                                    <span className={styles.infoValue}>{session.user.email}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <span className={styles.statusBadge}>
                                        <FiClock size={12} /> Pending Review
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className={styles.timeline}>
                            <div className={`${styles.timelineStep} ${styles.completed}`}>
                                <div className={styles.timelineDot} />
                                <span>Account Created</span>
                            </div>
                            <div className={`${styles.timelineStep} ${styles.active}`}>
                                <div className={styles.timelineDot} />
                                <span>Admin Review</span>
                            </div>
                            <div className={styles.timelineStep}>
                                <div className={styles.timelineDot} />
                                <span>Access Granted</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: '/' })}>
                                <FiLogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
