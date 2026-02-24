'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { TbDental } from 'react-icons/tb';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/landmarks', label: 'Landmarks' },
    { href: '/education', label: 'Education' },
    { href: '/diagnosis', label: 'Diagnosis' },
    { href: '/forensics', label: 'Forensics' },
    { href: '/compare', label: 'Compare' },
    { href: '/about', label: 'About' },
];

export default function Navbar() {
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <motion.nav
            className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
            <div className={`container ${styles.navInner}`}>
                <Link href="/" className={styles.logo}>
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
                    {navLinks.map((link) => {
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
                    <motion.button
                        className={styles.themeBtn}
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle theme"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={theme}
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

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
                            <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
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
                {mobileOpen && (
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
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link
                                    href={link.href}
                                    className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
                                >
                                    {link.label}
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
