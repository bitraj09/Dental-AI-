'use client';
import { useEffect } from 'react';
import InstallPrompt from './InstallPrompt';

/**
 * Registers the service worker and renders the InstallPrompt.
 * Client component so it can use useEffect.
 */
export default function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('[PWA] SW registered:', reg.scope))
                .catch((err) => console.warn('[PWA] SW registration failed:', err));
        }
    }, []);

    return <InstallPrompt />;
}
