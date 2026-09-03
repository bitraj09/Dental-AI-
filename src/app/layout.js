import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import AuthContext from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PWARegister from '@/components/PWARegister';
import ThemeToggleFAB from '@/components/ThemeToggleFAB';
import { DentalStateProvider } from '@/context/DentalStateContext';

export const metadata = {
  title: 'DentalAI — AI-Powered Dental Radiograph Analysis',
  description: 'Detect landmarks, diagnose conditions, educate students, and estimate age from dental radiographs using AI.',
  keywords: ['dental AI', 'radiograph analysis', 'orthopantomogram', 'landmark detection', 'dental diagnosis', 'forensic odontology'],
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#a855f7',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a855f7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <script
          id="theme-initializer"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('dental-ai-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {}
               })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthContext>
          <ThemeProvider>
            <DentalStateProvider>
              <Navbar />
              <main style={{ paddingTop: 'var(--nav-height)' }}>
                {children}
              </main>
              <Footer />
              <PWARegister />
              <ThemeToggleFAB />
            </DentalStateProvider>
          </ThemeProvider>
        </AuthContext>
      </body>
    </html>
  );
}

