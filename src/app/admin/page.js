'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUsers, FiUserCheck, FiUserX, FiClock, FiSearch,
    FiChevronDown, FiChevronUp, FiEye, FiCheck, FiX,
    FiCpu, FiZap, FiBox, FiShield, FiRefreshCw
} from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const MODEL_OPTIONS = [
    { id: 'GOOGLE_AI', label: 'Google AI (Gemini)', icon: <FiZap size={20} />, color: '#6366f1', desc: 'Real Google Gemini API — production quality' },
    { id: 'MOCK_AI', label: 'Mock AI', icon: <FiCpu size={20} />, color: '#f59e0b', desc: 'Fake/demo responses for testing' },
    { id: 'OWN_AI', label: 'Own AI (Custom)', icon: <FiBox size={20} />, color: '#22c55e', desc: 'Custom trained dental model' },
];

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteSecretKey, setDeleteSecretKey] = useState('');
    const [activeModel, setActiveModel] = useState('GOOGLE_AI');
    const [modelLoading, setModelLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [zoomImage, setZoomImage] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'ADMIN') {
                router.push('/');
                return;
            }
            fetchUsers();
            fetchActiveModel();
        }
    }, [status, session]);

    const fetchUsers = async (statusFilter) => {
        setRefreshing(true);
        try {
            const filterParam = statusFilter || filter;
            const res = await fetch(`/api/admin/users?status=${filterParam}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.users) setUsers(data.users);
            if (data.stats) setStats(data.stats);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchActiveModel = async () => {
        try {
            const res = await fetch('/api/admin/set-model', { cache: 'no-store' });
            const data = await res.json();
            if (data.activeModel) setActiveModel(data.activeModel);
        } catch (err) {
            console.error('Failed to fetch model:', err);
        }
    };

    const handleAction = async (userId, action, reason) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, reason }),
            });

            if (res.ok) {
                setShowRejectModal(null);
                setRejectReason('');
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Action failed');
            }
        } catch (err) {
            console.error('Action failed:', err);
            alert('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAdmin = async () => {
        setActionLoading(showDeleteModal);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: showDeleteModal,
                    action: 'delete',
                    password: deletePassword,
                    secretKey: deleteSecretKey
                }),
            });

            if (res.ok) {
                setShowDeleteModal(null);
                setDeletePassword('');
                setDeleteSecretKey('');
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Delete failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleModelChange = async (model) => {
        setModelLoading(true);
        try {
            const res = await fetch('/api/admin/set-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model }),
            });

            if (res.ok) {
                setActiveModel(model);
            }
        } catch (err) {
            console.error('Model change failed:', err);
        } finally {
            setModelLoading(false);
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        fetchUsers(newFilter);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.collegeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner} />
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className={styles.pageTitle}>
                            <FiShield size={28} /> Admin Dashboard
                        </h1>
                        <p className={styles.pageSubtitle}>Manage users, approvals, and AI model settings</p>
                    </div>
                    <button
                        className="btn btn-outline"
                        onClick={() => fetchUsers()}
                        disabled={refreshing}
                        style={{ padding: '8px 16px' }}
                    >
                        <FiRefreshCw size={16} className={refreshing ? styles.spinning : ''} /> Refresh
                    </button>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    className={styles.statsGrid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={`${styles.statCard} ${filter === 'PENDING' ? styles.statActive : ''}`} onClick={() => handleFilterChange('PENDING')}>
                        <FiClock className={styles.statIcon} style={{ color: '#f59e0b' }} />
                        <div>
                            <span className={styles.statValue}>{stats.PENDING}</span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                    </div>
                    <div className={`${styles.statCard} ${filter === 'APPROVED' ? styles.statActive : ''}`} onClick={() => handleFilterChange('APPROVED')}>
                        <FiUserCheck className={styles.statIcon} style={{ color: '#22c55e' }} />
                        <div>
                            <span className={styles.statValue}>{stats.APPROVED}</span>
                            <span className={styles.statLabel}>Approved</span>
                        </div>
                    </div>
                    <div className={`${styles.statCard} ${filter === 'REJECTED' ? styles.statActive : ''}`} onClick={() => handleFilterChange('REJECTED')}>
                        <FiUserX className={styles.statIcon} style={{ color: '#ef4444' }} />
                        <div>
                            <span className={styles.statValue}>{stats.REJECTED}</span>
                            <span className={styles.statLabel}>Rejected</span>
                        </div>
                    </div>
                    <div className={styles.statCard} onClick={() => handleFilterChange('')}>
                        <FiUsers className={styles.statIcon} style={{ color: '#a855f7' }} />
                        <div>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>Total Users</span>
                        </div>
                    </div>
                </motion.div>

                {/* AI Model Switcher */}
                <motion.div
                    className={styles.modelSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className={styles.sectionTitle}>
                        <FiCpu size={20} /> AI Model Control
                    </h2>
                    <div className={styles.modelGrid}>
                        {MODEL_OPTIONS.map((model) => (
                            <motion.button
                                key={model.id}
                                className={`${styles.modelCard} ${activeModel === model.id ? styles.modelActive : ''}`}
                                onClick={() => handleModelChange(model.id)}
                                disabled={modelLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    '--model-color': model.color,
                                    borderColor: activeModel === model.id ? model.color : undefined,
                                }}
                            >
                                <div className={styles.modelIcon} style={{ color: model.color, background: `${model.color}15` }}>
                                    {model.icon}
                                </div>
                                <div className={styles.modelInfo}>
                                    <span className={styles.modelLabel}>{model.label}</span>
                                    <span className={styles.modelDesc}>{model.desc}</span>
                                </div>
                                {activeModel === model.id && (
                                    <motion.div
                                        className={styles.modelBadge}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{ background: model.color }}
                                    >
                                        Active
                                    </motion.div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Users List */}
                <motion.div
                    className={styles.usersSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className={styles.usersHeader}>
                        <h2 className={styles.sectionTitle}>
                            <FiUsers size={20} /> {filter || 'All'} Users
                        </h2>
                        <div className={styles.searchBar}>
                            <FiSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by name, email, or college..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.usersList}>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, idx) => (
                                <motion.div
                                    key={user.id}
                                    className={styles.userCard}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    layout
                                >
                                    <div className={styles.userMain} onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                                        <div className={styles.userAvatar}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userEmail}>{user.email}</span>
                                            <span className={styles.userCollege}>{user.collegeName} — {user.collegeYear}</span>
                                        </div>
                                        <div className={styles.userMeta}>
                                            <span className={`${styles.statusTag} ${styles[`status${user.status}`]}`}>
                                                {user.status}
                                            </span>
                                            <span className={styles.userDate}>
                                                {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        {expandedUser === user.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                    </div>

                                    <AnimatePresence>
                                        {expandedUser === user.id && (
                                            <motion.div
                                                className={styles.userExpanded}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className={styles.expandedGrid}>
                                                    <div className={styles.expandedInfo}>
                                                        <div className={styles.infoItem}>
                                                            <span className={styles.infoLabel}>College ID Number</span>
                                                            <span className={styles.infoValue}>{user.collegeIdNumber || 'N/A'}</span>
                                                        </div>
                                                        <div className={styles.infoItem}>
                                                            <span className={styles.infoLabel}>Records Created</span>
                                                            <span className={styles.infoValue}>{user._count?.records || 0}</span>
                                                        </div>
                                                        <div className={styles.infoItem}>
                                                            <span className={styles.infoLabel}>Role</span>
                                                            <span className={styles.infoValue}>{user.role}</span>
                                                        </div>
                                                        {user.rejectionReason && (
                                                            <div className={styles.infoItem}>
                                                                <span className={styles.infoLabel}>Rejection Reason</span>
                                                                <span className={styles.infoValue} style={{ color: '#ef4444' }}>{user.rejectionReason}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ID Card Preview */}
                                                    {user.idCardPath && (
                                                        <div className={styles.idCardPreview}>
                                                            <span className={styles.infoLabel}>College ID Card</span>
                                                            <img
                                                                src={user.idCardPath}
                                                                alt="ID Card"
                                                                className={styles.idCardImage}
                                                                onClick={() => setZoomImage(user.idCardPath)}
                                                                title="Click to view full size"
                                                            />
                                                            <button
                                                                className={styles.viewFullBtn}
                                                                onClick={() => setZoomImage(user.idCardPath)}
                                                            >
                                                                <FiEye size={14} /> View Full Size
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                {user.role === 'ADMIN' ? (
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={styles.rejectBtn}
                                                            onClick={() => setShowDeleteModal(user.id)}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            <FiUserX size={16} /> Delete Admin
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {user.status !== 'APPROVED' && (
                                                            <div className={styles.actionButtons}>
                                                                <button
                                                                    className={styles.approveBtn}
                                                                    onClick={() => handleAction(user.id, 'approve')}
                                                                    disabled={actionLoading === user.id}
                                                                >
                                                                    <FiCheck size={16} /> {actionLoading === user.id ? 'Processing...' : 'Approve'}
                                                                </button>
                                                                {user.status !== 'REJECTED' && (
                                                                    <button
                                                                        className={styles.rejectBtn}
                                                                        onClick={() => setShowRejectModal(user.id)}
                                                                        disabled={actionLoading === user.id}
                                                                    >
                                                                        <FiX size={16} /> Reject
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {user.status === 'APPROVED' && (
                                                            <div className={styles.actionButtons}>
                                                                <button
                                                                    className={styles.rejectBtn}
                                                                    onClick={() => setShowRejectModal(user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                >
                                                                    <FiX size={16} /> Revoke Access
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <FiUsers size={40} />
                                <p>No {filter.toLowerCase()} users found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowRejectModal(null)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={styles.modalTitle}>Reject User</h3>
                            <p className={styles.modalDesc}>Provide a reason for rejection (will be shown to the user):</p>
                            <textarea
                                className={styles.modalTextarea}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Invalid college ID card, incomplete information..."
                                rows={3}
                            />
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.rejectBtn}
                                    onClick={() => handleAction(showRejectModal, 'reject', rejectReason)}
                                    disabled={actionLoading === showRejectModal}
                                >
                                    <FiX size={16} /> {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Admin Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(null)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete Admin</h3>
                            <p className={styles.modalDesc}>Please enter your password and secret key to confirm administrative deletion.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
                                <input
                                    type="password"
                                    className={styles.modalTextarea}
                                    style={{ minHeight: '40px', padding: '10px' }}
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Enter Password"
                                />
                                <input
                                    type="password"
                                    className={styles.modalTextarea}
                                    style={{ minHeight: '40px', padding: '10px' }}
                                    value={deleteSecretKey}
                                    onChange={(e) => setDeleteSecretKey(e.target.value)}
                                    placeholder="Enter Secret Key"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.rejectBtn}
                                    onClick={handleDeleteAdmin}
                                    disabled={actionLoading === showDeleteModal || !deletePassword || !deleteSecretKey}
                                >
                                    <FiUserX size={16} /> {actionLoading ? 'Deleting...' : 'Delete Admin'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => { setShowDeleteModal(null); setDeletePassword(''); setDeleteSecretKey(''); }}>
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ID Card Zoom Lightbox */}
            <AnimatePresence>
                {zoomImage && (
                    <motion.div
                        className={styles.lightboxOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setZoomImage(null)}
                    >
                        <motion.div
                            className={styles.lightboxContent}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className={styles.lightboxClose} onClick={() => setZoomImage(null)}>
                                <FiX size={24} />
                            </button>
                            <img src={zoomImage} alt="ID Card Full Size" className={styles.lightboxImage} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
