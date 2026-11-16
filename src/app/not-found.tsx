import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Building2, LayoutDashboard } from 'lucide-react';

export default function AdminNotFoundPage() {
  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            HTTP 404 • Not Found
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Route Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or resource you requested does not exist or may have been relocated within the Platform Admin console.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/merchants"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Building2 className="w-4 h-4" />
            <span>Merchants</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
