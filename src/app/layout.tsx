import type { Metadata, Viewport } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const rajdhani = Rajdhani({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  title: 'NCC Cadet Examination & Question Bank System',
  description: 'Full-stack assessment platform for National Cadet Corps examinations, question bank authoring, and paper import.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

const themeScript = `
  (function() {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ncc_theme', 'light');
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} font-sans bg-slate-50 text-slate-900 min-h-screen`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
