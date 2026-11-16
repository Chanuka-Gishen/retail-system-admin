'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  RefreshCw,
  CreditCard,
  Plus,
  Pencil,
  Store,
  Warehouse,
  Users,
  Package,
  AlertCircle,
  X,
  Power,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  tier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  description?: string | null;
  priceMonthly: number;
  priceQuarterly: number;
  priceAnnually: number;
  maxBranches: number;
  maxWarehouses: number;
  maxUsers: number;
  maxProducts: number;
  hasOfflinePos: boolean;
  hasAdvancedAccounting: boolean;
  isActive: boolean;
  _count?: {
    subscriptions: number;
  };
}

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
  const isViewer = user?.role === 'PLATFORM_VIEWER';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form State
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    tier: 'BASIC' as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM',
    description: '',
    priceMonthly: 0,
    priceQuarterly: 0,
    priceAnnually: 0,
    maxBranches: 1,
    maxWarehouses: 1,
    maxUsers: 3,
    maxProducts: 500,
    hasOfflinePos: true,
    hasAdvancedAccounting: true,
    isActive: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const fetchPlans = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApiClient<SubscriptionPlan[]>('/platform/plans');
      setPlans(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err: any) {
      console.warn('Fetch plans error:', err);
      setErrorMessage(err.message || 'Failed to load subscription plans.');
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Open Create Plan Modal
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      code: `PLAN_CUSTOM_${Math.floor(1000 + Math.random() * 9000)}`,
      tier: 'BASIC',
      description: '',
      priceMonthly: 5000,
      priceQuarterly: 14000,
      priceAnnually: 50000,
      maxBranches: 1,
      maxWarehouses: 1,
      maxUsers: 5,
      maxProducts: 1000,
      hasOfflinePos: true,
      hasAdvancedAccounting: true,
      isActive: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditModal = (p: SubscriptionPlan) => {
    setEditingPlan(p);
    setPlanForm({
      name: p.name || '',
      code: p.code || '',
      tier: p.tier || 'BASIC',
      description: p.description || '',
      priceMonthly: Number(p.priceMonthly || 0),
      priceQuarterly: Number(p.priceQuarterly || 0),
      priceAnnually: Number(p.priceAnnually || 0),
      maxBranches: Number(p.maxBranches || 1),
      maxWarehouses: Number(p.maxWarehouses || 1),
      maxUsers: Number(p.maxUsers || 1),
      maxProducts: Number(p.maxProducts || 500),
      hasOfflinePos: Boolean(p.hasOfflinePos),
      hasAdvancedAccounting: Boolean(p.hasAdvancedAccounting),
      isActive: Boolean(p.isActive),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Save Plan (Create or Update)
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      setErrorMessage('Plan name is required.');
      return;
    }

    setIsActionLoading('save-plan');
    setErrorMessage(null);
    try {
      if (editingPlan) {
        // Update existing plan
        const payload = {
          name: planForm.name.trim(),
          tier: planForm.tier,
          description: planForm.description.trim() || undefined,
          priceMonthly: Number(planForm.priceMonthly),
          priceQuarterly: Number(planForm.priceQuarterly),
          priceAnnually: Number(planForm.priceAnnually),
          maxBranches: Number(planForm.maxBranches),
          maxWarehouses: Number(planForm.maxWarehouses),
          maxUsers: Number(planForm.maxUsers),
          maxProducts: Number(planForm.maxProducts),
          hasOfflinePos: planForm.hasOfflinePos,
          hasAdvancedAccounting: planForm.hasAdvancedAccounting,
          isActive: planForm.isActive,
        };

        await adminApiClient(`/platform/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: payload,
        });
        setSuccessMessage(`Plan "${payload.name}" updated successfully.`);
      } else {
        // Create new plan
        const payload = {
          code: planForm.code.trim().toUpperCase(),
          name: planForm.name.trim(),
          tier: planForm.tier,
          description: planForm.description.trim() || undefined,
          priceMonthly: Number(planForm.priceMonthly),
          priceQuarterly: Number(planForm.priceQuarterly),
          priceAnnually: Number(planForm.priceAnnually),
          maxBranches: Number(planForm.maxBranches),
          maxWarehouses: Number(planForm.maxWarehouses),
          maxUsers: Number(planForm.maxUsers),
          maxProducts: Number(planForm.maxProducts),
          hasOfflinePos: planForm.hasOfflinePos,
          hasAdvancedAccounting: planForm.hasAdvancedAccounting,
        };

        await adminApiClient('/platform/plans', {
          method: 'POST',
          body: payload,
        });
        setSuccessMessage(`Plan "${payload.name}" created successfully.`);
      }

      setIsModalOpen(false);
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage(`Failed to save plan: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // Toggle Plan Active Status
  const handleTogglePlanStatus = async (p: SubscriptionPlan) => {
    const actionText = p.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} plan "${p.name}"?`)) return;

    setIsActionLoading(`toggle-${p.id}`);
    setErrorMessage(null);
    try {
      await adminApiClient(`/platform/plans/${p.id}`, {
        method: 'PUT',
        body: { isActive: !p.isActive },
      });
      setSuccessMessage(`Plan "${p.name}" is now ${!p.isActive ? 'Active' : 'Inactive'}.`);
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage(`Failed to change plan status: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner Alerts */}
      {errorMessage && (
        <div className="bg-rose-950 border border-rose-800 text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View-Only Mode Banner */}
      {isViewer && (
        <div className="bg-sky-950 border border-sky-800 rounded-2xl p-4 flex items-center justify-between text-xs text-sky-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-sky-900 border border-sky-700 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="font-bold text-white">Viewer Mode Active (Read-Only)</p>
              <p className="text-sky-300 text-[11px]">
                You have inspection permissions. Creating tiers, adjusting quotas/pricing, or activating/deactivating plans is restricted to Platform Administrators.
              </p>
            </div>
          </div>
          <span className="bg-sky-900 text-sky-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-sky-700 tracking-wider">
            READ-ONLY
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-tenant subscription tiers, quota limits, offline POS rules, and billing intervals
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchPlans()}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition disabled:opacity-50"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          {!isViewer && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Plans Grid with Loading Skeletons & Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`plan-skeleton-${idx}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-3 w-16 bg-slate-800 rounded"></div>
                <div className="h-6 w-36 bg-slate-800 rounded"></div>
                <div className="h-8 w-28 bg-slate-800 rounded"></div>
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="h-3 w-full bg-slate-800 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-800 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-800 rounded"></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 h-8 bg-slate-800 rounded-xl"></div>
            </div>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Subscription Plans Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No subscription tiers were found in the system. Click "Create New Plan" to set up your first subscription tier.
            </p>
            {!isViewer && (
              <div className="pt-2">
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Plan</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          plans.map((p) => {
            const isToggling = isActionLoading === `toggle-${p.id}`;
            const subscriberCount = p._count?.subscriptions || 0;

            return (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition ${
                  p.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-800 opacity-75'
                }`}
              >
                {/* Popular Badge for PRO */}
                {p.code === 'PLAN_PRO' && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    POPULAR
                  </div>
                )}

                <div>
                  {/* Top Meta: Code, Tier, and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      {p.code}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.tier}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          p.isActive
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border-rose-800'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Plan Name & Description */}
                  <h2 className="text-xl font-bold text-white">{p.name}</h2>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {p.description || 'Standard multi-tenant retail quota configuration.'}
                  </p>

                  {/* Pricing Box */}
                  <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-black text-white font-mono">
                        LKR {Number(p.priceMonthly || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 font-mono">
                      <span>Quarterly: LKR {Number(p.priceQuarterly || 0).toLocaleString()}</span>
                      <span>Annual: LKR {Number(p.priceAnnually || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quota Limits List */}
                  <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2 text-slate-400">
                        <Store className="w-3.5 h-3.5 text-sky-400" />
                        <span>Store Branches</span>
                      </span>
                      <strong className="text-white font-mono">{p.maxBranches}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2 text-slate-400">
                        <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Warehouses</span>
                      </span>
                      <strong className="text-white font-mono">{p.maxWarehouses}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Staff User Accounts</span>
                      </span>
                      <strong className="text-white font-mono">{p.maxUsers}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2 text-slate-400">
                        <Package className="w-3.5 h-3.5 text-teal-400" />
                        <span>Catalog Products</span>
                      </span>
                      <strong className="text-white font-mono">
                        {p.maxProducts ? p.maxProducts.toLocaleString() : 'Unlimited'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">Full Offline POS</span>
                      <span
                        className={`font-semibold ${
                          p.hasOfflinePos ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {p.hasOfflinePos ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Double-Entry Accounting</span>
                      <span
                        className={`font-semibold ${
                          p.hasAdvancedAccounting ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {p.hasAdvancedAccounting ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <span className="font-mono font-bold text-white">{subscriberCount}</span>
                    <span>merchants</span>
                  </div>

                  {isViewer ? (
                    <span className="text-[11px] text-slate-500 italic font-medium px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                      View Only
                    </span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTogglePlanStatus(p)}
                        disabled={isToggling}
                        className={`p-2 rounded-xl text-xs font-semibold border transition ${
                          p.isActive
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-400 border-rose-800'
                            : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800'
                        }`}
                        title={p.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                      >
                        {isToggling ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Plan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE OR EDIT SUBSCRIPTION PLAN                  */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define quota boundaries, pricing schedules, and system capabilities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Plan Identity & Tier
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plan Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Professional Growth Tier"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Plan Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingPlan}
                      placeholder="PLAN_PRO"
                      value={planForm.code}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subscription Tier
                    </label>
                    <select
                      value={planForm.tier}
                      onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="BASIC">BASIC</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief summary of target customer segment..."
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Pricing Schedule (LKR)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monthly Price (LKR) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={planForm.priceMonthly}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Quarterly Price (LKR) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={planForm.priceQuarterly}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, priceQuarterly: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Annual Price (LKR) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={planForm.priceAnnually}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, priceAnnually: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resource Quota Limits */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Resource Quota Limits
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Branches <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={planForm.maxBranches}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, maxBranches: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Warehouses <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={planForm.maxWarehouses}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, maxWarehouses: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Staff Users <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={planForm.maxUsers}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Products <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={planForm.maxProducts}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, maxProducts: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Flags & Active Status */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Feature Flags & Availability
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.hasOfflinePos}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, hasOfflinePos: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200 font-medium">Offline POS Mode</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.hasAdvancedAccounting}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, hasAdvancedAccounting: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200 font-medium">Double-Entry Accounting</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.isActive}
                      onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs text-slate-200 font-medium">Plan Is Active</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'save-plan'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'save-plan' && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {isActionLoading === 'save-plan'
                      ? 'Saving Plan...'
                      : editingPlan
                      ? 'Update Plan'
                      : 'Create Plan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
