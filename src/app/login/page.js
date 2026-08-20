'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { TbDental } from 'react-icons/tb';
import styles from './page.module.css';

function LoginForm() {
    const router = useRouter();
    const { status } = useSession();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const msg = searchParams.get('msg');

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/landmarks');
        }
    }, [status, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const email = e.target.email.value;
        const password = e.target.password.value;

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (result.error) {
            setError('Invalid email or password');
            setLoading(false);
        } else {
            router.push('/diagnosis');
        }
    };

    return (
        <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
            {/* Logo */}
            <div className={styles.logoSection}>
                <motion.div
                    className={styles.logoIcon}
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <TbDental size={32} />
                </motion.div>
                <h1>Welcome Back</h1>
                <p>Sign in to your student account to access AI‑powered dental analysis tools.</p>
            </div>

            {/* Messages */}
            {msg && (
                <motion.div
                    className={styles.success}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FiCheckCircle size={18} />
                    {msg}
                </motion.div>
            )}
            {error && (
                <motion.div
                    className={styles.error}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FiAlertCircle size={18} />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email Address</label>
                    <div className={styles.inputInner}>
                        <FiMail className={styles.icon} />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@college.edu"
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="password">Password</label>
                    <div className={styles.inputInner}>
                        <FiLock className={styles.icon} />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted, #94a3b8)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                zIndex: 10,
                            }}
                        >
                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                    </div>
                </div>

                <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                >
                    {loading ? (
                        <span className={styles.spinner} />
                    ) : (
                        'Sign In'
                    )}
                </motion.button>
            </form>

            <div className={styles.divider}>or</div>

            <div className={styles.footer}>
                Don&apos;t have an account?{' '}
                <Link href="/signup">Create Account →</Link>
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className={styles.pageWrapper}>
            {/* Animated background */}
            <div className={styles.bgBlob1} />
            <div className={styles.bgBlob2} />
            <div className={styles.bgBlob3} />

            <Suspense fallback={
                <div className={styles.card} style={{ textAlign: 'center', padding: 40 }}>
                    <TbDental size={32} style={{ opacity: 0.5 }} />
                    <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
