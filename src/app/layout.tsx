import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AdminNavbar } from '../components/AdminNavbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Platform Admin OS | Retail Cloud SaaS',
  description: 'Enterprise SuperAdmin Multi-Tenant Management Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 antialiased`}>
        <AdminNavbar>{children}</AdminNavbar>
      </body>
    </html>
  );
}
