'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiBook, FiCalendar, FiCreditCard, FiUpload, FiArrowRight, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { signIn } from 'next-auth/react';
import styles from './page.module.css';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [idFile, setIdFile] = useState(null);
    const [idPreview, setIdPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIdFile(file);
            setIdPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Client-side validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!idFile) {
            setError('Please upload your college ID card');
            setLoading(false);
            return;
        }

        if (idFile) formData.set('idCard', idFile);

        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // Automatic login after signup
            const signResult = await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirect: false,
            });

            if (signResult?.error) {
                router.push('/login?msg=Signup successful. Please login.');
            } else {
                router.push('/diagnosis');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            {/* Animated background */}
            <div className={styles.bgBlob1} />
            <div className={styles.bgBlob2} />
            <div className={styles.bgBlob3} />

            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
                <div className={styles.header}>
                    <h2>Create Student Account</h2>
                    <p>Register with your college details to access DentalAI tools.</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.sectionTitle}>
                        <FiUser /> Personal Information
                    </div>
                    <div className={styles.grid}>
                        <div className={styles.inputGroup}>
                            <FiUser className={styles.icon} />
                            <input type="text" name="name" placeholder="Full Name" required />
                        </div>
                        <div className={styles.inputGroup}>
                            <FiMail className={styles.icon} />
                            <input type="email" name="email" placeholder="Email Address" required />
                        </div>
                        <div className={styles.inputGroup}>
                            <FiLock className={styles.icon} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                required
                                minLength={8}
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
                        <div className={styles.inputGroup}>
                            <FiLock className={styles.icon} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                required
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.sectionTitle}>
                        <FiBook /> College Details
                    </div>
                    <div className={styles.grid}>
                        <div className={styles.inputGroup}>
                            <FiBook className={styles.icon} />
                            <input type="text" name="collegeName" placeholder="College Name" required />
                        </div>
                        <div className={styles.inputGroup}>
                            <FiCalendar className={styles.icon} />
                            <select name="collegeYear" required>
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year (Final)</option>
                                <option value="Intern">Intern</option>
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <FiCreditCard className={styles.icon} />
                            <input type="text" name="collegeIdNumber" placeholder="College ID Number" required />
                        </div>
                    </div>

                    <div className={styles.sectionTitle}>
                        <FiUpload /> College ID Card Upload
                    </div>
                    <div className={styles.uploadArea}>
                        <input
                            type="file"
                            id="idCard"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                        />
                        <label htmlFor="idCard" className={styles.uploadLabel}>
                            {idPreview ? (
                                <img src={idPreview} alt="Preview" className={styles.preview} />
                            ) : (
                                <>
                                    <FiUpload size={32} />
                                    <span>Upload Photo of ID Card</span>
                                    <small>JPG, PNG supported</small>
                                </>
                            )}
                        </label>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creating Account...' : (
                            <>
                                <span>Complete Registration</span>
                                <FiArrowRight />
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    Already have an account? <Link href="/login">Log In</Link>
                </div>
            </motion.div>
        </div>
    );
}
