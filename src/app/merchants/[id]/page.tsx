'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Store,
  Users,
  CreditCard,
  Warehouse,
  Mail,
  Phone,
  CheckCircle,
  Ban,
  RotateCcw,
  Pencil,
  Plus,
  RefreshCw,
  FileText,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Clock,
  FileCheck,
  Eye,
} from 'lucide-react';
import { adminApiClient } from '../../../lib/api-client';
import { useAdminAuthStore } from '../../../lib/auth-store';

interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  tier: string;
  description?: string;
  priceMonthly: number | string;
  priceQuarterly?: number | string;
  priceAnnually: number | string;
  maxBranches: number;
  maxWarehouses: number;
  maxUsers: number;
  maxProducts: number;
  hasOfflinePos: boolean;
  hasAdvancedAccounting: boolean;
  isActive: boolean;
}

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
  const isViewer = user?.role === 'PLATFORM_VIEWER';

  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<any | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'subscription' | 'users' | 'warehouses'>('overview');

  // Edit Merchant Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    businessName: '',
    tradeName: '',
    taxNumber: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    planId: '',
    billingCycle: 'MONTHLY',
    subscriptionStatus: 'ACTIVE',
    status: 'ACTIVE',
  });

  // Subscription Management Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [subForm, setSubForm] = useState({
    planId: '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    status: 'ACTIVE' as 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED',
    endDate: '',
    generateInvoice: false,
  });

  // Offline Bank Slip / WhatsApp Transfer Modal State
  const [isBankSlipModalOpen, setIsBankSlipModalOpen] = useState<boolean>(false);
  const [bankSlipForm, setBankSlipForm] = useState({
    planId: '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
    amountPaid: 0,
    transferReference: '',
    bankName: 'Commercial Bank',
    paymentDate: new Date().toISOString().split('T')[0] ?? '',
    notes: 'Received bank transfer receipt via WhatsApp',
    bankSlipUrl: '',
  });

  // Grace Period Modal State
  const [isGraceModalOpen, setIsGraceModalOpen] = useState<boolean>(false);
  const [graceReason, setGraceReason] = useState<string>(
    'WhatsApp request: Awaiting bank transfer confirmation',
  );

  // Add / Edit Branch Modal State
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    isMain: false,
    isActive: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch Merchant Details
  const fetchMerchantDetails = useCallback(async () => {
    if (!merchantId) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);
    try {
      const res = await adminApiClient<any>(`/platform/merchants/${merchantId}`);
      if (!res) {
        setIsNotFound(true);
      } else {
        setMerchant(res);
      }
    } catch (err: any) {
      console.warn('Fetch merchant detail error:', err);
      if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
        setIsNotFound(true);
      } else {
        setErrorMessage(err.message || 'Failed to load merchant details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  // Fetch Subscription Plans (for edit modal)
  const fetchPlans = async () => {
    try {
      const res = await adminApiClient<SubscriptionPlan[]>('/platform/plans');
      setPlans(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err) {
      console.warn('Fetch plans error:', err);
    }
  };

  useEffect(() => {
    fetchMerchantDetails();
    fetchPlans();
  }, [fetchMerchantDetails]);

  // --- ACTIONS ---
  const handleApprove = async () => {
    if (!merchant) return;
    setIsActionLoading('approve');
    try {
      await adminApiClient(`/platform/merchants/${merchant.id}/approve`, { method: 'POST' });
      setSuccessMessage('Merchant organization approved successfully.');
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Approval failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!merchant) return;
    if (!confirm('Are you sure you want to suspend this merchant organization? All user sessions will be revoked.')) return;
    setIsActionLoading('suspend');
    try {
      await adminApiClient(`/platform/merchants/${merchant.id}/suspend`, {
        method: 'POST',
        body: { reason: 'Administrative suspension via Platform Admin console' },
      });
      setSuccessMessage('Merchant organization suspended.');
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Suspension failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    if (!merchant) return;
    setIsActionLoading('reactivate');
    try {
      await adminApiClient(`/platform/merchants/${merchant.id}/reactivate`, { method: 'POST' });
      setSuccessMessage('Merchant organization reactivated.');
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Reactivation failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- EDIT MERCHANT MODAL ---
  const handleOpenEditModal = () => {
    if (!merchant) return;
    const activeSub = merchant.subscriptions?.[0];
    setEditForm({
      businessName: merchant.businessName || '',
      tradeName: merchant.tradeName || '',
      taxNumber: merchant.taxNumber || '',
      contactEmail: merchant.contactEmail || '',
      contactPhone: merchant.contactPhone || '',
      currency: merchant.currency || 'LKR',
      timezone: merchant.timezone || 'Asia/Colombo',
      planId: activeSub?.planId || activeSub?.plan?.id || plans[0]?.id || '',
      billingCycle: activeSub?.billingCycle || 'MONTHLY',
      subscriptionStatus: activeSub?.status || 'ACTIVE',
      status: merchant.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    setIsActionLoading('edit-save');
    setErrorMessage(null);
    try {
      const payload: any = {
        businessName: editForm.businessName.trim(),
        tradeName: editForm.tradeName.trim() || undefined,
        taxNumber: editForm.taxNumber.trim() || undefined,
        contactEmail: editForm.contactEmail.trim().toLowerCase(),
        contactPhone: editForm.contactPhone.trim(),
        currency: editForm.currency,
        timezone: editForm.timezone,
        planId: editForm.planId || undefined,
        billingCycle: editForm.billingCycle,
        subscriptionStatus: editForm.subscriptionStatus,
        status: editForm.status,
      };

      await adminApiClient(`/platform/merchants/${merchant.id}`, {
        method: 'PUT',
        body: payload,
      });

      setIsEditModalOpen(false);
      setSuccessMessage(`Merchant details updated successfully.`);
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Failed to update merchant: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- MANAGE SUBSCRIPTION ---
  const handleOpenSubscriptionModal = () => {
    if (!merchant) return;
    const activeSub = merchant.subscriptions?.[0];
    const initialPlanId = activeSub?.planId || activeSub?.plan?.id || plans[0]?.id || '';
    setSubForm({
      planId: initialPlanId,
      billingCycle: (activeSub?.billingCycle as any) || 'MONTHLY',
      status: (activeSub?.status as any) || 'ACTIVE',
      endDate: activeSub?.endDate ? (new Date(activeSub.endDate).toISOString().split('T')[0] ?? '') : '',
      generateInvoice: false,
    });
    setErrorMessage(null);
    setIsSubModalOpen(true);
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !subForm.planId) return;

    setIsActionLoading('sub-save');
    setErrorMessage(null);
    try {
      const payload: any = {
        planId: subForm.planId,
        billingCycle: subForm.billingCycle,
        status: subForm.status,
        generateInvoice: subForm.generateInvoice,
      };
      if (subForm.endDate) {
        payload.endDate = new Date(subForm.endDate).toISOString();
      }

      await adminApiClient(`/platform/merchants/${merchant.id}/subscription`, {
        method: 'PUT',
        body: payload,
      });

      setIsSubModalOpen(false);
      setSuccessMessage('Subscription plan and status updated successfully.');
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Failed to update subscription: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- BANK SLIP / WHATSAPP RENEWAL ---
  const handleOpenBankSlipModal = () => {
    if (!merchant) return;
    const activeSub = merchant.subscriptions?.[0];
    const initialPlanId = activeSub?.planId || activeSub?.plan?.id || plans[0]?.id || '';
    const initialPlan = plans.find((p) => p.id === initialPlanId) || plans[0];
    const cycle = (activeSub?.billingCycle as any) || 'MONTHLY';
    const initialAmount =
      cycle === 'ANNUALLY'
        ? initialPlan?.priceAnnually || 0
        : cycle === 'QUARTERLY'
        ? initialPlan?.priceQuarterly || 0
        : initialPlan?.priceMonthly || 0;

    setBankSlipForm({
      planId: initialPlanId,
      billingCycle: cycle,
      amountPaid: Number(initialAmount),
      transferReference: '',
      bankName: 'Commercial Bank',
      paymentDate: new Date().toISOString().split('T')[0] ?? '',
      notes: 'Received bank transfer receipt via WhatsApp',
      bankSlipUrl: '',
    });
    setErrorMessage(null);
    setIsBankSlipModalOpen(true);
  };

  const handleBankSlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    if (!bankSlipForm.transferReference.trim()) {
      alert('Transfer Reference / Slip Number is required.');
      return;
    }

    setIsActionLoading('bank-renew-save');
    setErrorMessage(null);
    try {
      await adminApiClient(
        `/platform/merchants/${merchant.id}/subscription/renew-bank-transfer`,
        {
          method: 'POST',
          body: {
            planId: bankSlipForm.planId || undefined,
            billingCycle: bankSlipForm.billingCycle,
            amountPaid: Number(bankSlipForm.amountPaid),
            transferReference: bankSlipForm.transferReference.trim(),
            bankName: bankSlipForm.bankName.trim() || undefined,
            paymentDate: bankSlipForm.paymentDate
              ? new Date(bankSlipForm.paymentDate).toISOString()
              : undefined,
            notes: bankSlipForm.notes.trim() || undefined,
            bankSlipUrl: bankSlipForm.bankSlipUrl.trim() || undefined,
          },
        },
      );

      setIsBankSlipModalOpen(false);
      setSuccessMessage(
        'Subscription successfully renewed via bank transfer receipt! Invoice marked as PAID and access extended.',
      );
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Failed to renew subscription: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- GRACE PERIOD ---
  const handleOpenGraceModal = () => {
    setGraceReason('WhatsApp request: Bank transfer promised within the week');
    setErrorMessage(null);
    setIsGraceModalOpen(true);
  };

  const handleGrantGracePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    setIsActionLoading('grace-save');
    setErrorMessage(null);
    try {
      await adminApiClient(`/platform/merchants/${merchant.id}/subscription/grace-period`, {
        method: 'POST',
        body: {
          days: 7,
          reason: graceReason.trim() || undefined,
        },
      });

      setIsGraceModalOpen(false);
      setSuccessMessage(
        '1-Week Grace Period (+7 Days) granted successfully. Merchant and shop staff logins are now enabled.',
      );
      await fetchMerchantDetails();
    } catch (err: any) {
      setErrorMessage(`Failed to grant grace period: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- ADD / EDIT BRANCH ---
  const handleOpenAddBranch = () => {
    const nextNum = (merchant?.branches?.length || 0) + 1;
    setBranchForm({
      code: `BR-0${nextNum}`,
      name: '',
      address: '',
      phone: '',
      isMain: false,
      isActive: true,
    });
    setEditingBranch(null);
    setIsAddBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: any) => {
    setEditingBranch(b);
    setBranchForm({
      code: b.code || '',
      name: b.name || '',
      address: b.address || '',
      phone: b.phone || '',
      isMain: Boolean(b.isMain),
      isActive: Boolean(b.isActive),
    });
    setIsAddBranchModalOpen(true);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    if (!branchForm.code || !branchForm.name) {
      alert('Branch Code and Branch Name are required.');
      return;
    }

    setIsActionLoading('branch-save');
    try {
      if (editingBranch) {
        await adminApiClient(`/platform/merchants/${merchant.id}/branches/${editingBranch.id}`, {
          method: 'PUT',
          body: {
            code: branchForm.code.trim().toUpperCase(),
            name: branchForm.name.trim(),
            address: branchForm.address.trim() || undefined,
            phone: branchForm.phone.trim() || undefined,
            isMain: branchForm.isMain,
            isActive: branchForm.isActive,
          },
        });
        setSuccessMessage(`Shop "${branchForm.name}" updated successfully.`);
      } else {
        await adminApiClient(`/platform/merchants/${merchant.id}/branches`, {
          method: 'POST',
          body: {
            code: branchForm.code.trim().toUpperCase(),
            name: branchForm.name.trim(),
            address: branchForm.address.trim() || undefined,
            phone: branchForm.phone.trim() || undefined,
            isMain: branchForm.isMain,
            isActive: branchForm.isActive,
          },
        });
        setSuccessMessage(`Shop "${branchForm.name}" created successfully.`);
      }

      setIsAddBranchModalOpen(false);
      setEditingBranch(null);
      await fetchMerchantDetails();
    } catch (err: any) {
      alert(`Branch action failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- SKELETON LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-950 p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 bg-slate-800 rounded"></div>

        {/* Hero Card Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-64 bg-slate-800 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-4 w-20 bg-slate-800 rounded"></div>
                <div className="h-4 w-16 bg-slate-800 rounded"></div>
                <div className="h-4 w-24 bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-24 bg-slate-800 rounded-xl"></div>
              <div className="h-9 w-24 bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="h-3 w-20 bg-slate-800 rounded"></div>
              <div className="h-6 w-28 bg-slate-800 rounded"></div>
              <div className="h-2 w-full bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Tab & Table Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="h-8 w-80 bg-slate-800 rounded-xl"></div>
          <div className="h-40 w-full bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // --- NOT FOUND STATE ---
  if (isNotFound || !merchant) {
    return (
      <div className="flex-1 bg-slate-950 p-6 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[60vh]">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Merchant Not Found</h2>
          <p className="text-xs text-slate-400">
            No merchant organization could be found matching ID <span className="font-mono text-emerald-400">"{merchantId}"</span>. It may have been deleted or the link is invalid.
          </p>
          <div className="pt-2">
            <Link
              href="/merchants"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Merchants Directory</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quota & Calculation Helpers
  const activeSubscription = merchant.subscriptions?.[0];
  const currentPlan: SubscriptionPlan | undefined = activeSubscription?.plan;
  const branchesList = merchant.branches || [];
  const usersList = merchant.users || [];
  const warehousesList = merchant.warehouses || [];
  const invoicesList = merchant.subscriptionInvoices || [];

  const maxBranches = currentPlan?.maxBranches || 1;
  const maxWarehouses = currentPlan?.maxWarehouses || 1;
  const maxUsers = currentPlan?.maxUsers || 3;

  const branchPct = Math.min(100, Math.round((branchesList.length / maxBranches) * 100));
  const warehousePct = Math.min(100, Math.round((warehousesList.length / maxWarehouses) * 100));
  const userPct = Math.min(100, Math.round((usersList.length / maxUsers) * 100));

  const now = new Date();
  const subEndDate = activeSubscription?.endDate ? new Date(activeSubscription.endDate) : null;
  const isSubExpired = Boolean(
    activeSubscription &&
      (activeSubscription.status === 'EXPIRED' ||
        activeSubscription.status === 'CANCELLED' ||
        (subEndDate && subEndDate < now)),
  );
  const subRemainingDays = subEndDate
    ? Math.ceil((subEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isGraceActive = !isSubExpired && subRemainingDays !== null && subRemainingDays <= 7 && subRemainingDays >= 0;

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
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-4 flex items-center space-x-3 text-xs text-amber-200 animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-amber-900 border border-amber-700 text-amber-300 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Platform View-Only Mode Active</span>
            <p className="text-[11px] text-amber-200 mt-0.5">
              You are signed in as a <strong>Platform Viewer</strong>. You have read-only authority to inspect this merchant's profile, stores, and subscription history. Editing and renewal actions are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div>
        <Link
          href="/merchants"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          <span>Back to Merchants Directory</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>{merchant.businessName}</span>
                  {merchant.tradeName && (
                    <span className="text-sm font-normal text-slate-400">({merchant.tradeName})</span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tenant ID: <span className="font-mono text-slate-300">{merchant.id}</span>
                </p>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg">
                {merchant.code}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                  merchant.status === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : merchant.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {merchant.status}
              </span>

              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-lg">
                Currency: <strong className="text-white">{merchant.currency || 'LKR'}</strong>
              </span>

              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-lg">
                Timezone: <strong className="text-white">{merchant.timezone || 'Asia/Colombo'}</strong>
              </span>

              {currentPlan && (
                <span className="bg-teal-950 text-teal-300 border border-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-lg">
                  Tier: {currentPlan.name} ({activeSubscription?.billingCycle || 'MONTHLY'})
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {!isViewer && (
              <>
                <button
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Organization</span>
                </button>

                {merchant.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={handleApprove}
                    disabled={isActionLoading === 'approve'}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isActionLoading === 'approve' ? 'Approving...' : 'Approve Application'}</span>
                  </button>
                )}

                {merchant.status === 'ACTIVE' && (
                  <button
                    onClick={handleSuspend}
                    disabled={isActionLoading === 'suspend'}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl transition"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isActionLoading === 'suspend' ? 'Suspending...' : 'Suspend Tenant'}</span>
                  </button>
                )}

                {merchant.status === 'SUSPENDED' && (
                  <button
                    onClick={handleReactivate}
                    disabled={isActionLoading === 'reactivate'}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isActionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Tenant'}</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={fetchMerchantDetails}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              title="Refresh Merchant Details"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Quotas & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscription */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Subscription Tier</span>
            <CreditCard className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {currentPlan?.name || 'Basic Tier'}
          </div>
          <div className="text-xs text-slate-400">
            Billing: <strong className="text-slate-200">{activeSubscription?.billingCycle || 'MONTHLY'}</strong> • Status:{' '}
            <span
              className={`font-semibold ${
                isSubExpired
                  ? 'text-rose-400'
                  : isGraceActive
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {isSubExpired
                ? 'EXPIRED'
                : isGraceActive
                ? `GRACE (${subRemainingDays}d left)`
                : activeSubscription?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Card 2: Branch Quota */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Store Branches</span>
            <Store className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white">{branchesList.length}</span>
            <span className="text-xs text-slate-400">/ {maxBranches} allowed</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${branchPct >= 100 ? 'bg-amber-400' : 'bg-sky-500'}`}
              style={{ width: `${branchPct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Warehouse Quota */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Warehouses</span>
            <Warehouse className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white">{warehousesList.length}</span>
            <span className="text-xs text-slate-400">/ {maxWarehouses} allowed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${warehousePct >= 100 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${warehousePct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: Staff Users Quota */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Staff Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white">{usersList.length}</span>
            <span className="text-xs text-slate-400">/ {maxUsers} allowed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${userPct >= 100 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${userPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organization Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'branches'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Shops & Branches ({branchesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'subscription'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription & Invoices ({invoicesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'warehouses'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Warehouses ({warehousesList.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ORGANIZATION PROFILE & CONTACT                    */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Details Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Legal & Business Profile</span>
              </h3>
              <button
                onClick={handleOpenEditModal}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Registered Business Name
                </span>
                <p className="text-white font-semibold text-sm">{merchant.businessName}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Trade / Display Name
                </span>
                <p className="text-white font-semibold text-sm">{merchant.tradeName || '—'}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Tax Identification / BRN
                </span>
                <p className="text-white font-mono font-semibold">{merchant.taxNumber || '—'}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Primary Contact Email
                </span>
                <p className="text-white font-semibold flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{merchant.contactEmail}</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Primary Contact Phone
                </span>
                <p className="text-white font-semibold flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{merchant.contactPhone}</span>
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Currency & Accounting Timezone
                </span>
                <p className="text-white font-semibold">
                  {merchant.currency || 'LKR'} • {merchant.timezone || 'Asia/Colombo'}
                </p>
              </div>
            </div>

            {/* Lifecycle Auditing Info */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-slate-400">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Onboarded At</span>
                <span className="text-slate-300 font-medium">
                  {new Date(merchant.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Approved At</span>
                <span className="text-slate-300 font-medium">
                  {merchant.approvedAt ? new Date(merchant.approvedAt).toLocaleString() : 'Pending Approval'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase">Last Updated</span>
                <span className="text-slate-300 font-medium">
                  {new Date(merchant.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary / Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Tenant Status Overview</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    merchant.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : merchant.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {merchant.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subscription Tier</span>
                <span className="text-white font-semibold">{currentPlan?.name || 'BASIC'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Billing Interval</span>
                <span className="text-white font-semibold uppercase">
                  {activeSubscription?.billingCycle || 'MONTHLY'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Store Locations</span>
                <span className="text-white font-semibold">{branchesList.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registered Staff</span>
                <span className="text-white font-semibold">{usersList.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Central Warehouses</span>
                <span className="text-white font-semibold">{warehousesList.length}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setActiveTab('branches')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Manage Stores & Terminals</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View Staff Accounts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SHOPS & BRANCHES                                  */}
      {/* ======================================================== */}
      {activeTab === 'branches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Store className="w-5 h-5 text-sky-400" />
                <span>Shops & Branch Stores ({branchesList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical retail outlets, POS register endpoints, and warehouse links
              </p>
            </div>

            {!isViewer && (
              <button
                onClick={handleOpenAddBranch}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Shop</span>
              </button>
            )}
          </div>

          {branchesList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Store className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-300">No Branch Stores Configured</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This merchant does not have any active stores registered. Click "Add New Shop" to provision a branch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Store Code</th>
                    <th className="py-3 px-4">Store Name & HQ</th>
                    <th className="py-3 px-4">Location & Phone</th>
                    <th className="py-3 px-4">Linked Warehouse</th>
                    <th className="py-3 px-4 text-center">POS Terminals</th>
                    <th className="py-3 px-4 text-center">Sales Count</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {branchesList.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-850 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">{b.code}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <span>{b.name}</span>
                          {b.isMain && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              HEADQUARTERS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {b.address && <div>{b.address}</div>}
                        {b.phone && <div className="text-slate-500 text-[11px] mt-0.5">{b.phone}</div>}
                        {!b.address && !b.phone && <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {b.defaultWarehouse ? (
                          <div className="flex items-center space-x-1 text-slate-300">
                            <Warehouse className="w-3 h-3 text-emerald-400" />
                            <span>{b.defaultWarehouse.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {b._count?.posTerminals ?? b.terminalsCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {b._count?.sales ?? b.salesCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditBranch(b)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                          title="Edit Store"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SUBSCRIPTION & INVOICES                           */}
      {/* ======================================================== */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* SUBSCRIPTION STATUS WARNING / EXPIRATION BANNER */}
          {isSubExpired && (
            <div className="bg-rose-950 border border-rose-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-900 border border-rose-700 text-rose-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Subscription Expired — System Access Blocked</h4>
                    <span className="bg-rose-900 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-rose-700">
                      Logins Blocked
                    </span>
                  </div>
                  <p className="text-xs text-rose-200 mt-1 max-w-2xl leading-relaxed">
                    This merchant's subscription period ended on{' '}
                    <strong className="text-white font-mono">
                      {subEndDate ? subEndDate.toLocaleDateString() : 'N/A'}
                    </strong>
                    . Merchant admins, cashiers, and POS terminals cannot log into the cloud platform. Grant a 1-week grace period to allow store operations, or record bank transfer proof received via WhatsApp to renew access.
                  </p>
                </div>
              </div>
              {!isViewer && (
                <div className="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={handleOpenGraceModal}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-amber-950 hover:bg-amber-950 text-amber-300 border border-amber-600 rounded-xl text-xs font-bold transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Grant 1-Week Grace</span>
                  </button>
                  <button
                    onClick={handleOpenBankSlipModal}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Renew (WhatsApp Slip)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!isSubExpired && subRemainingDays !== null && subRemainingDays <= 7 && (
            <div className="bg-amber-950 border border-amber-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-900 border border-amber-700 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">Subscription Renewal Due / Grace Period Active</h4>
                    <span className="bg-amber-900 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-700">
                      {subRemainingDays === 0 ? 'Expires Today' : `${subRemainingDays} Days Remaining`}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200 mt-0.5 leading-relaxed">
                    Access will automatically lock when the validity ends on{' '}
                    <strong className="text-white font-mono">{subEndDate?.toLocaleDateString()}</strong> unless renewed via bank transfer.
                  </p>
                </div>
              </div>
              {!isViewer && (
                <div className="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={handleOpenGraceModal}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>+7 Days Grace</span>
                  </button>
                  <button
                    onClick={handleOpenBankSlipModal}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Renew via WhatsApp Slip</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Plan Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Subscription Plan</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    isSubExpired
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : isGraceActive
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : activeSubscription?.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : activeSubscription?.status === 'TRIALING'
                      ? 'bg-sky-950 text-sky-400 border-sky-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isSubExpired
                    ? 'EXPIRED'
                    : isGraceActive
                    ? 'GRACE PERIOD'
                    : activeSubscription?.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{currentPlan?.name || 'Basic Tier'}</h3>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-3xl font-black text-white">
                    {merchant.currency || 'LKR'}{' '}
                    {Number(
                      activeSubscription?.billingCycle === 'ANNUALLY'
                        ? currentPlan?.priceAnnually || 0
                        : activeSubscription?.billingCycle === 'QUARTERLY'
                        ? currentPlan?.priceQuarterly || 0
                        : currentPlan?.priceMonthly || 0,
                    ).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {activeSubscription?.billingCycle ? activeSubscription.billingCycle.toLowerCase() : 'month'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {currentPlan?.description || 'Multi-tenant subscription quota tier.'}
                </p>
              </div>

              {/* Validity Details Box */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Billing Interval</span>
                  <span className="text-white font-semibold uppercase font-mono">
                    {activeSubscription?.billingCycle || 'MONTHLY'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Start Date</span>
                  <span className="text-slate-300 font-mono">
                    {activeSubscription?.startDate
                      ? new Date(activeSubscription.startDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Valid Until / Renewal</span>
                  <span
                    className={`font-mono font-bold ${
                      isSubExpired
                        ? 'text-rose-400'
                        : isGraceActive
                        ? 'text-amber-400'
                        : 'text-teal-300'
                    }`}
                  >
                    {activeSubscription?.endDate
                      ? new Date(activeSubscription.endDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                {subRemainingDays !== null && (
                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-850">
                    <span>Access Status</span>
                    <span
                      className={`font-semibold ${
                        isSubExpired
                          ? 'text-rose-400'
                          : isGraceActive
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {isSubExpired
                        ? 'BLOCKED (Expired)'
                        : `${subRemainingDays} days remaining`}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Renew via Bank Transfer, Grace Period, Change Plan */}
              {isViewer ? (
                <div className="py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-xs text-slate-400 font-medium flex items-center justify-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                    <span>Plan modifications disabled (View-Only Mode)</span>
                  </span>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleOpenBankSlipModal}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Renew via Bank Transfer (WhatsApp)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleOpenGraceModal}
                      className="py-2 px-3 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 hover:border-amber-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Grant 1-Wk Grace</span>
                    </button>

                    <button
                      onClick={handleOpenSubscriptionModal}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>Change Tier</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Plan Limits List */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Max Store Branches</span>
                  <strong className="text-white font-mono">{currentPlan?.maxBranches}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Warehouses</span>
                  <strong className="text-white font-mono">{currentPlan?.maxWarehouses}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Staff Users</span>
                  <strong className="text-white font-mono">{currentPlan?.maxUsers}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Products</span>
                  <strong className="text-white font-mono">
                    {currentPlan?.maxProducts?.toLocaleString() || 'Unlimited'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Full Offline POS</span>
                  <strong className={currentPlan?.hasOfflinePos ? 'text-emerald-400' : 'text-slate-500'}>
                    {currentPlan?.hasOfflinePos ? 'Enabled' : 'Disabled'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Double-Entry Accounting</span>
                  <strong className={currentPlan?.hasAdvancedAccounting ? 'text-emerald-400' : 'text-slate-500'}>
                    {currentPlan?.hasAdvancedAccounting ? 'Enabled' : 'Disabled'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Subscription Invoices ({invoicesList.length})</span>
                </h4>
              </div>

              {invoicesList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-400 text-xs">No invoices generated yet</p>
                  <p className="text-[11px] text-slate-500">
                    Subscription invoices will be generated and tracked on billing cycles.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Invoice Number</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Paid Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {invoicesList.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-850 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {inv.currency || 'LKR'} {Number(inv.amount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : inv.status === 'OVERDUE'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TEAM & USERS                                      */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Staff & User Accounts ({usersList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Merchant operators, store managers, cashiers, and primary organization owners
              </p>
            </div>
          </div>

          {usersList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No User Accounts Found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Branch Access</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {usersList.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-850 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          {u.isOwner && (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              OWNER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{u.email}</td>
                      <td className="py-3 px-4 text-slate-400">{u.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-emerald-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.branchAccess && u.branchAccess.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.branchAccess.map((ba: any) => (
                              <span
                                key={ba.id}
                                className="bg-slate-950 border border-slate-800 text-sky-400 text-[10px] px-1.5 py-0.5 rounded"
                              >
                                {ba.branch?.code || 'Store'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">All Branches</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: WAREHOUSES                                        */}
      {/* ======================================================== */}
      {activeTab === 'warehouses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Warehouse className="w-5 h-5 text-emerald-400" />
                <span>Central Warehouses & Inventory Storage ({warehousesList.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Central storage facilities, depots, and inventory dispatch locations
              </p>
            </div>
          </div>

          {warehousesList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Warehouse className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No Warehouses Registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Warehouse Code</th>
                    <th className="py-3 px-4">Warehouse Name</th>
                    <th className="py-3 px-4 text-center">Designation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {warehousesList.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-850 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{w.code}</td>
                      <td className="py-3 px-4 font-semibold text-white">{w.name}</td>
                      <td className="py-3 px-4 text-center">
                        {w.isMain ? (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded">
                            PRIMARY WAREHOUSE
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Secondary</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {w.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT MERCHANT PROFILE                           */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Edit Organization Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trade / Display Name</label>
                  <input
                    type="text"
                    value={editForm.tradeName}
                    onChange={(e) => setEditForm({ ...editForm, tradeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tax / BRN Number</label>
                  <input
                    type="text"
                    value={editForm.taxNumber}
                    onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.contactPhone}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Plan</label>
                  <select
                    value={editForm.planId}
                    onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
                  <select
                    value={editForm.billingCycle}
                    onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MONTHLY">MONTHLY (Every 30 days)</option>
                    <option value="QUARTERLY">QUARTERLY (Every 90 days)</option>
                    <option value="ANNUALLY">ANNUALLY (Every 365 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Status</label>
                  <select
                    value={editForm.subscriptionStatus}
                    onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIALING">TRIALING</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LKR">LKR (Sri Lankan Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'edit-save'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'edit-save' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isActionLoading === 'edit-save' ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT BRANCH                               */}
      {/* ======================================================== */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Branch / Store'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddBranchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-02"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch / Store Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kandy Mall Store"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Main St, Kandy"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Store Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +94812345678"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-6 text-xs text-slate-300 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branchForm.isMain}
                      onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Headquarters Main Store</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branchForm.isActive}
                      onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Active Store</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddBranchModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'branch-save'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'branch-save' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBranch ? 'Save Branch' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: MANAGE SUBSCRIPTION                             */}
      {/* ======================================================== */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Manage Subscription</h3>
                  <p className="text-xs text-slate-400">
                    Update quota tier, billing cycle, or subscription status for {merchant.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubscriptionSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Select Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Subscription Plan <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-2">
                  {plans.map((p) => {
                    const isSelected = subForm.planId === p.id;
                    const price =
                      subForm.billingCycle === 'ANNUALLY'
                        ? p.priceAnnually
                        : subForm.billingCycle === 'QUARTERLY'
                        ? p.priceQuarterly
                        : p.priceMonthly;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSubForm({ ...subForm, planId: p.id })}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-950 border-teal-600 ring-1 ring-teal-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {p.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                            <span>Max {p.maxBranches} Branches</span>
                            <span>•</span>
                            <span>Max {p.maxUsers} Users</span>
                            <span>•</span>
                            <span>Max {p.maxWarehouses} Warehouses</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white font-mono">
                            {merchant.currency || 'LKR'} {Number(price || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 lowercase">
                            per {subForm.billingCycle.toLowerCase()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing Cycle & Status in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={subForm.billingCycle}
                    onChange={(e) =>
                      setSubForm({ ...subForm, billingCycle: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="MONTHLY">Monthly (Every 30 days)</option>
                    <option value="QUARTERLY">Quarterly (Every 90 days)</option>
                    <option value="ANNUALLY">Annually (Every 365 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={subForm.status}
                    onChange={(e) =>
                      setSubForm({ ...subForm, status: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIALING">TRIALING</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              {/* Optional End Date Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Validity / End Date (Optional Override)
                </label>
                <input
                  type="date"
                  value={subForm.endDate}
                  onChange={(e) => setSubForm({ ...subForm, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to auto-calculate the renewal date based on the chosen billing cycle.
                </p>
              </div>

              {/* Generate Invoice Checkbox */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={subForm.generateInvoice}
                    onChange={(e) =>
                      setSubForm({ ...subForm, generateInvoice: e.target.checked })
                    }
                    className="rounded bg-slate-900 border-slate-700 text-teal-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-white">Generate Subscription Invoice</span>
                    <p className="text-[11px] text-slate-400">
                      Creates an issued invoice for this cycle in the merchant's billing history.
                    </p>
                  </div>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'sub-save'}
                  className="px-5 py-2 bg-slate-900 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'sub-save' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isActionLoading === 'sub-save' ? 'Saving Subscription...' : 'Save Subscription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RECORD BANK TRANSFER / WHATSAPP SLIP RENEWAL     */}
      {/* ======================================================== */}
      {isBankSlipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Renew via Bank Transfer (WhatsApp)</h3>
                  <p className="text-xs text-slate-400">
                    Verify offline bank transfer slip for {merchant.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBankSlipModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBankSlipSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-3 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold text-white">Automated Actions on Submit:</p>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-300 text-[11px]">
                  <li>Generates and marks a subscription invoice as <strong>PAID</strong></li>
                  <li>Records an official audit log in <strong>Platform Payment Verifications</strong></li>
                  <li>Advances subscription end date and restores full POS & login access immediately</li>
                </ul>
              </div>

              {/* Select Plan & Billing Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subscription Plan <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={bankSlipForm.planId}
                    onChange={(e) => {
                      const selectedPlanId = e.target.value;
                      const p = plans.find((pl) => pl.id === selectedPlanId);
                      const price =
                        bankSlipForm.billingCycle === 'ANNUALLY'
                          ? p?.priceAnnually
                          : bankSlipForm.billingCycle === 'QUARTERLY'
                          ? p?.priceQuarterly
                          : p?.priceMonthly;
                      setBankSlipForm({
                        ...bankSlipForm,
                        planId: selectedPlanId,
                        amountPaid: Number(price || 0),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Billing Cycle <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={bankSlipForm.billingCycle}
                    onChange={(e) => {
                      const cycle = e.target.value as any;
                      const p = plans.find((pl) => pl.id === bankSlipForm.planId);
                      const price =
                        cycle === 'ANNUALLY'
                          ? p?.priceAnnually
                          : cycle === 'QUARTERLY'
                          ? p?.priceQuarterly
                          : p?.priceMonthly;
                      setBankSlipForm({
                        ...bankSlipForm,
                        billingCycle: cycle,
                        amountPaid: Number(price || 0),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MONTHLY">Monthly (+30 Days)</option>
                    <option value="QUARTERLY">Quarterly (+90 Days)</option>
                    <option value="ANNUALLY">Annually (+365 Days)</option>
                  </select>
                </div>
              </div>

              {/* Amount Paid & Bank Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount Paid ({merchant.currency || 'LKR'}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={bankSlipForm.amountPaid}
                    onChange={(e) =>
                      setBankSlipForm({ ...bankSlipForm, amountPaid: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Slip / Transfer Reference <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN-789012 or WA-SLIP-091"
                    value={bankSlipForm.transferReference}
                    onChange={(e) =>
                      setBankSlipForm({ ...bankSlipForm, transferReference: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Bank Name & Payment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Commercial Bank, Sampath, HNB"
                    value={bankSlipForm.bankName}
                    onChange={(e) => setBankSlipForm({ ...bankSlipForm, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Transfer Date
                  </label>
                  <input
                    type="date"
                    value={bankSlipForm.paymentDate}
                    onChange={(e) =>
                      setBankSlipForm({ ...bankSlipForm, paymentDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Slip Image/Document URL (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank Slip Image URL / Document Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... or WhatsApp drive attachment link"
                  value={bankSlipForm.bankSlipUrl}
                  onChange={(e) =>
                    setBankSlipForm({ ...bankSlipForm, bankSlipUrl: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Verification Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding WhatsApp receipt verification..."
                  value={bankSlipForm.notes}
                  onChange={(e) => setBankSlipForm({ ...bankSlipForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBankSlipModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'bank-renew-save'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'bank-renew-save' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isActionLoading === 'bank-renew-save' ? 'Renewing...' : 'Confirm Slip & Renew'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: GRANT 1-WEEK GRACE PERIOD                        */}
      {/* ======================================================== */}
      {isGraceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Grant 1-Week Grace Period</h3>
                  <p className="text-xs text-slate-400">{merchant.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsGraceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantGracePeriodSubmit} className="p-6 space-y-4">
              <div className="bg-amber-950 border border-amber-800 rounded-xl p-3.5 text-xs text-amber-200 space-y-2">
                <div className="flex items-center justify-between border-b border-amber-800 pb-2">
                  <span className="text-slate-400">Extension Duration:</span>
                  <strong className="text-amber-300 font-mono">+7 Days (1 Week)</strong>
                </div>
                <div className="flex items-center justify-between border-b border-amber-800 pb-2">
                  <span className="text-slate-400">Current End Date:</span>
                  <span className="text-slate-200 font-mono font-semibold">
                    {subEndDate ? subEndDate.toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Merchant & Shop Logins:</span>
                  <span className="text-emerald-400 font-bold">Unblocked Immediately</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / WhatsApp Promise Note
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. WhatsApp message received: Merchant promised bank transfer slip by Friday..."
                  value={graceReason}
                  onChange={(e) => setGraceReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsGraceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'grace-save'}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'grace-save' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isActionLoading === 'grace-save' ? 'Extending...' : 'Grant 1-Week Grace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
