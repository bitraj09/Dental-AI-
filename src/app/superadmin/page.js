'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiSliders, FiUsers, FiUserPlus, FiTrash2, FiShield, FiCpu, FiZap, FiBox } from 'react-icons/fi';
import styles from './page.module.css';

const MODEL_OPTIONS = [
    { id: 'GOOGLE_AI', label: 'Google AI (Gemini)', icon: <FiZap size={20} />, color: '#6366f1', desc: 'Real Google Gemini API — production quality' },
    { id: 'MOCK_AI', label: 'Mock AI', icon: <FiCpu size={20} />, color: '#f59e0b', desc: 'Fake/demo responses for testing' },
    { id: 'OWN_AI', label: 'Own AI (Custom)', icon: <FiBox size={20} />, color: '#22c55e', desc: 'Custom trained dental model' },
];

const FEATURES = [
    { key: 'FEATURE_LANDMARKS', label: 'Landmarks' },
    { key: 'FEATURE_DIAGNOSIS', label: 'Diagnosis' },
    { key: 'FEATURE_FORENSICS', label: 'Forensics' },
    { key: 'FEATURE_COMPARE', label: 'Comparison' },
    { key: 'FEATURE_EDUCATION', label: 'Education' },
];

export default function SuperAdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [config, setConfig] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [blockedColleges, setBlockedColleges] = useState([]);
    const [newBlockedCollege, setNewBlockedCollege] = useState('');
    const [activeModel, setActiveModel] = useState('GOOGLE_AI');
    const [modelLoading, setModelLoading] = useState(false);

    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER', collegeName: '' });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?super=1');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'SUPER_ADMIN') {
                router.push('/');
                return;
            }
            fetchConfig();
            fetchUsers();
        }
    }, [status, session]);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/superadmin/config');
            const data = await res.json();
            if (data.config) {
                setConfig(data.config);
                if (data.config['BLOCKED_COLLEGES']) {
                    setBlockedColleges(data.config['BLOCKED_COLLEGES'].split(',').map(s => s.trim()).filter(Boolean));
                }
                if (data.config['activeModel']) setActiveModel(data.config['activeModel']);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/superadmin/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = async (key, currentValue) => {
        const newValue = currentValue === 'false' ? 'true' : 'false';
        try {
            await fetch('/api/superadmin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: newValue })
            });
            setConfig({ ...config, [key]: newValue });
        } catch (err) { }
    };

    const handleModelChange = async (model) => {
        setModelLoading(true);
        try {
            const res = await fetch('/api/superadmin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'activeModel', value: model })
            });
            if (res.ok) {
                setActiveModel(model);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setModelLoading(false);
        }
    };

    const handleAddBlockedCollege = async () => {
        if (!newBlockedCollege.trim()) return;
        const updatedList = [...blockedColleges, newBlockedCollege.trim()];
        try {
            await fetch('/api/superadmin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'BLOCKED_COLLEGES', value: updatedList.join(',') })
            });
            setBlockedColleges(updatedList);
            setNewBlockedCollege('');
        } catch (err) { }
    };

    const handleRemoveBlockedCollege = async (collegeToRemove) => {
        const updatedList = blockedColleges.filter(c => c !== collegeToRemove);
        try {
            await fetch('/api/superadmin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'BLOCKED_COLLEGES', value: updatedList.join(',') })
            });
            setBlockedColleges(updatedList);
        } catch (err) { }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/superadmin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', ...newUser })
            });
            if (res.ok) {
                setNewUser({ name: '', email: '', password: '', role: 'USER', collegeName: '' });
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add user');
            }
        } catch (err) { }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user/admin?')) return;
        try {
            const res = await fetch('/api/superadmin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', userId })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) { }
    };

    if (loading) return <div className="container" style={{ paddingTop: 100 }}>Loading Super Admin...</div>;

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}><FiShield size={32} /> Super Admin Dashboard</h1>
                        <p className={styles.pageSubtitle}>Master control panel for system features and administration.</p>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}><FiSliders /> Feature Toggles</h2>
                    <div className={styles.toggleGrid}>
                        {FEATURES.map((feature) => {
                            // Default all true if not set
                            const isEnabled = config[feature.key] !== 'false';
                            return (
                                <div key={feature.key} className={styles.toggleCard}>
                                    <span className={styles.toggleLabel}>{feature.label}</span>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={() => toggleFeature(feature.key, isEnabled ? 'true' : 'false')}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    className={styles.modelSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
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

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}><FiShield /> Blocked Colleges</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 15, fontSize: '0.9rem' }}>
                        Add college name keywords. Any signup containing these keywords will be blocked.
                    </p>
                    <div className={styles.inputGroup} style={{ maxWidth: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <input
                            type="text"
                            value={newBlockedCollege}
                            onChange={(e) => setNewBlockedCollege(e.target.value)}
                            placeholder="e.g. Fake University"
                            style={{ flex: 1 }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddBlockedCollege(); }}
                        />
                        <button className="btn btn-primary" onClick={handleAddBlockedCollege} style={{ width: 'fit-content', padding: '10px 20px' }} disabled={!newBlockedCollege.trim()}>
                            Add to Blocklist
                        </button>
                    </div>

                    <div className={styles.blockedList}>
                        {blockedColleges.length === 0 ? (
                            <p className={styles.emptyText}>No colleges currently blocked.</p>
                        ) : (
                            blockedColleges.map((college, idx) => (
                                <div key={idx} className={styles.blockedItem}>
                                    <span style={{ fontWeight: 600 }}>{college}</span>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => handleRemoveBlockedCollege(college)}
                                        style={{ color: '#ef4444', padding: '6px 10px', fontSize: '0.85rem' }}
                                    >
                                        <FiTrash2 size={16} /> Unblock
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}><FiUserPlus /> Add User or Admin</h2>
                    <form className={styles.addForm} onSubmit={handleAddUser}>
                        <div className={styles.inputGroup}>
                            <label>Name</label>
                            <input type="text" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input type="text" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>College Name</label>
                            <input type="text" value={newUser.collegeName} onChange={e => setNewUser({ ...newUser, collegeName: e.target.value })} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Role</label>
                            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div className={styles.btnAction} style={{ gridColumn: 'span 2' }}>
                            <button type="submit" className="btn btn-primary">Add {newUser.role}</button>
                        </div>
                    </form>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}><FiUsers /> Manage Existing Users & Admins</h2>
                    <div className={styles.userList}>
                        {users.map(u => (
                            <div key={u.id} className={styles.userItem}>
                                <div className={styles.userInfo}>
                                    <strong>{u.name} <span className={`${styles.roleBadge} ${styles['role' + u.role]}`}>{u.role}</span></strong>
                                    <span>{u.email} • {u.collegeName}</span>
                                </div>
                                <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteUser(u.id)}>
                                    <FiTrash2 /> Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
