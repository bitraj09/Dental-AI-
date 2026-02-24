import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'DentalAI — AI-Powered Dental Radiograph Analysis',
  description: 'Detect landmarks, diagnose conditions, educate students, and estimate age from dental radiographs using AI.',
  keywords: ['dental AI', 'radiograph analysis', 'orthopantomogram', 'landmark detection', 'dental diagnosis', 'forensic odontology'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main style={{ paddingTop: 'var(--nav-height)' }}>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
