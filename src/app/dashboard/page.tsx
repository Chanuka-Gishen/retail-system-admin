'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Clock,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuthStore();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchAdminOverview();
  }, [isAuthenticated, router]);

  const fetchAdminOverview = async () => {
    setIsLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        adminApiClient<any>('/platform/merchants?limit=100'),
        adminApiClient<any[]>('/platform/plans'),
      ]);

      setMerchants(mRes?.items || (Array.isArray(mRes) ? mRes : []));
      setPlans(Array.isArray(pRes) ? pRes : (pRes as any)?.items || []);
    } catch (err) {
      console.warn('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = merchants.filter((m) => m.status === 'PENDING_APPROVAL').length;
  const activeCount = merchants.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="flex-1 bg-slate-950 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Platform Overview</h1>
            <button
              onClick={fetchAdminOverview}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh Overview"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">Multi-tenant fleet status and organization onboarding</p>
        </div>

        <div className="flex items-center space-x-3">
          {pendingCount > 0 && !isLoading && (
            <Link
              href="/merchants"
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{pendingCount} Pending Approvals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href="/merchants"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Tenants</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (with Loading Skeletons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`kpi-skeleton-${i}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-800 rounded"></div>
                <div className="h-4 w-4 bg-slate-800 rounded"></div>
              </div>
              <div className="h-8 w-14 bg-slate-800 rounded"></div>
              <div className="h-3 w-32 bg-slate-800 rounded"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Total Tenants</span>
                <Building2 className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">{merchants.length}</div>
              <div className="text-xs text-sky-400 font-medium">Registered business entities</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Active Tenants</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
              <div className="text-xs text-slate-400">Live operational stores</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
              <div className="text-xs text-slate-400">Awaiting SuperAdmin approval</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
                <span>Tier Plans</span>
                <CreditCard className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-400">{plans.length}</div>
              <div className="text-xs text-slate-400">Public subscription tiers</div>
            </div>
          </>
        )}
      </div>

      {/* Empty State Banner if 0 Merchants */}
      {!isLoading && merchants.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">No Merchant Tenants Onboarded Yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't provisioned any merchants yet. Head over to the Merchants section to register your first business tenant.
          </p>
          <div className="pt-1">
            <Link
              href="/merchants"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Merchant</span>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Link
          href="/merchants"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl p-5 transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition">
            Merchant Organization Approval & Auditing
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Review self-registered merchants, approve bank slips, inspect branches, and manage lifecycle
          </p>
        </Link>

        <Link
          href="/plans"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl p-5 transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition">
            SaaS Subscription Tier Configurations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure Basic, Pro, and Enterprise subscription limits (branches, warehouses, users, pricing)
          </p>
        </Link>
      </div>
    </div>
  );
}
