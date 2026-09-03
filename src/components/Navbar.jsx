'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import { TbDental } from 'react-icons/tb';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';

const baseLinks = [
    { href: '/', label: 'Home' },
    { href: '/learning', label: 'Learning' },
    { href: '/landmarks', label: 'Landmarks' },
    { href: '/diagnosis', label: 'Diagnosis' },
    { href: '/compare', label: 'Compare' },
    { href: '/history', label: 'History' },
    { href: '/education', label: 'Education' },
    { href: '/landmark-practice', label: 'Practice' },
    { href: '/forensics', label: 'Forensics' },
    { href: '/tooth-chart', label: 'Charting' },
    { href: '/about', label: 'About' },
];

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [features, setFeatures] = useState(null);
    const router = useRouter();

    // Hidden admin access — 5 clicks on logo within 3 seconds
    const logoClickCount = useRef(0);
    const logoClickTimer = useRef(null);

    const handleLogoClick = useCallback((e) => {
        logoClickCount.current += 1;

        if (logoClickTimer.current) clearTimeout(logoClickTimer.current);

        if (logoClickCount.current > 5) {
            e.preventDefault();
            logoClickCount.current = 0;
            if (session?.user?.role === 'SUPER_ADMIN') {
                router.push('/superadmin');
            } else {
                router.push('/login?super=1');
            }
            return;
        }

        // Reset counter after 3 seconds of no clicks
        logoClickTimer.current = setTimeout(() => {
            logoClickCount.current = 0;
        }, 3000);
    }, [router, session]);

    // Filter base links by features
    const allowedBaseLinks = baseLinks.filter(link => {
        if (!features) return true; // Show all until loaded
        if (features[link.label] === false) return false;
        return true;
    });

    // Add admin link dynamically if user is admin
    const navLinks = session?.user?.role === 'ADMIN'
        ? [...allowedBaseLinks, { href: '/admin', label: 'Admin' }]
        : session?.user?.role === 'SUPER_ADMIN'
            ? [...allowedBaseLinks, { href: '/admin', label: 'Admin' }, { href: '/superadmin', label: 'Super Admin' }]
            : allowedBaseLinks;

    useEffect(() => {
        setMounted(true);
        fetch('/api/config/features').then(res => res.json()).then(data => setFeatures(data)).catch(() => { });
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <motion.nav
            className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
            <div className={`container ${styles.navInner}`}>
                <Link href="/" className={styles.logo} onClick={handleLogoClick}>
                    <motion.div
                        className={styles.logoIcon}
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <TbDental size={28} />
                    </motion.div>
                    <span className={styles.logoText}>DentalAI</span>
                </Link>

                <div className={styles.desktopLinks}>
                    {mounted && navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                {link.label}
                                {isActive && (
                                    <motion.div
                                        className={styles.underline}
                                        layoutId="nav-underline"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className={styles.actions}>
                    {mounted && (
                        session ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div className={styles.userPill}>
                                    <FiUser />
                                    <span>{session.user.name?.split(' ')[0] || 'User'}</span>
                                </div>
                                <button onClick={() => signOut()} className="btn btn-ghost" title="Sign Out">
                                    <FiLogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className={`btn btn-primary ${styles.desktopAuthBtn || ''}`} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                Sign In
                            </Link>
                        )
                    )}

                    <button
                        className={styles.mobileToggle}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && mounted && (
                    <motion.div
                        className={styles.mobileMenu}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {navLinks.map((link, i) => (
                            <motion.div
                                key={link.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <Link
                                    href={link.href}
                                    className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </motion.div>
                        ))}

                        {/* Auth section in mobile menu */}
                        <div className={styles.mobileAuth}>
                            {session ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600 }}>
                                        <FiUser size={16} />
                                        <span>{session.user.name || 'User'}</span>
                                    </div>
                                    <button onClick={() => signOut()} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <FiLogOut size={16} /> Sign Out
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    style={{ padding: '8px 16px' }}
                                >
                                    <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                        Sign In
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
