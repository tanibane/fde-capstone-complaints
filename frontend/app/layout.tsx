import type { Metadata } from 'next';
import NavBar from './NavBar';

export const metadata: Metadata = {
  title: 'Clearview Complaints — Monitoring Workbench',
  description: 'Agentic Complaints Management System — Clearview Retail Bank',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'IBM Plex Sans', sans-serif", background: '#f4f4f4' }}>
        <NavBar />
        <div style={{ minHeight: 'calc(100vh - 48px)', background: '#f4f4f4' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
