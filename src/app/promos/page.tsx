'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Power,
  Copy,
  Check,
  X,
  ExternalLink,
  Percent,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

export type PromoDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXTRA_TRIAL_DAYS';

interface PromoCodeItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  maxUses?: number | null;
  usedCount: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
  isExpired: boolean;
  isExhausted: boolean;
  affiliatePartnerName?: string | null;
  commissionRatePercent?: number | null;
  createdAt: string;
  stats: {
    totalRedemptions: number;
    activeMerchantsAcquired: number;
    totalDiscountGiven: number;
    totalRealizedRevenue: number;
    totalCommissionEarned: number;
  };
}

interface SummaryStats {
  totalPromos: number;
  activePromos: number;
  totalRedemptions: number;
  totalMerchantsAcquired: number;
  totalDiscountsGranted: number;
  totalRealizedRevenue: number;
  estimatedMonthlyGains: number;
  totalCommissionsEarned: number;
}

interface RedemptionMerchant {
  id: string;
  code: string;
  businessName: string;
  tradeName?: string | null;
  contactEmail: string;
  contactPhone: string;
  status: string;
  joinedAt: string;
}

interface RedemptionPlan {
  code: string;
  name: string;
  tier: string;
  billingCycle: string;
  status: string;
}

interface RedemptionInvoice {
  invoiceNumber: string;
  status: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
}

interface RedemptionItem {
  id: string;
  redeemedAt: string;
  discountAmount: number;
  invoiceAmountBeforeDiscount: number;
  invoiceAmountAfterDiscount: number;
  extraTrialDaysApplied?: number | null;
  commissionEarned: number;
  merchant: RedemptionMerchant;
  plan?: RedemptionPlan | null;
  invoice?: RedemptionInvoice | null;
}

export default function PromoCodesManagementPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
  const isViewer = user?.role === 'PLATFORM_VIEWER';

  // Core Data State
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State: Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as PromoDiscountType,
    discountValue: 10,
    maxUses: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
    affiliatePartnerName: '',
    commissionRatePercent: '',
  });

  // Drawer / Modal State: Customer Tracking & Redemptions
  const [trackingModalOpen, setTrackingModalOpen] = useState<boolean>(false);
  const [selectedPromoForTracking, setSelectedPromoForTracking] = useState<PromoCodeItem | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [isRedemptionsLoading, setIsRedemptionsLoading] = useState<boolean>(false);

  // Action Confirmation Modal (Delete / Status)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmPromo, setDeleteConfirmPromo] = useState<PromoCodeItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch summary and promo list
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const [promosRes, statsRes] = await Promise.all([
        adminApiClient<{ data: PromoCodeItem[]; meta: any }>('/platform/promos?limit=100'),
        adminApiClient<SummaryStats>('/platform/promos/summary'),
      ]);

      setPromos(promosRes?.data || []);
      setSummaryStats(statsRes || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load promotional codes and analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      isActive: true,
      affiliatePartnerName: '',
      commissionRatePercent: '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (promo: PromoCodeItem) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxUses: promo.maxUses ? String(promo.maxUses) : '',
      validFrom: promo.validFrom ? promo.validFrom.split('T')[0] : '',
      validUntil: promo.validUntil ? promo.validUntil.split('T')[0] : '',
      isActive: promo.isActive,
      affiliatePartnerName: promo.affiliatePartnerName || '',
      commissionRatePercent:
        promo.commissionRatePercent !== null && promo.commissionRatePercent !== undefined
          ? String(promo.commissionRatePercent)
          : '',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!formData.code.trim()) {
      setErrorMessage('Promo code is required');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%');
      return;
    }

    if (formData.discountValue <= 0) {
      setErrorMessage('Discount value must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: any = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
      validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      isActive: formData.isActive,
      affiliatePartnerName: formData.affiliatePartnerName.trim() || null,
      commissionRatePercent: formData.commissionRatePercent
        ? parseFloat(formData.commissionRatePercent)
        : null,
    };

    try {
      if (editingPromo) {
        await adminApiClient(`/platform/promos/${editingPromo.id}`, {
          method: 'PUT',
          body: payload,
        });
        setSuccessMessage(`Promo code '${payload.code}' updated successfully!`);
      } else {
        await adminApiClient('/platform/promos', {
          method: 'POST',
          body: payload,
        });
        setSuccessMessage(`Promo code '${payload.code}' created successfully!`);
      }

      setIsModalOpen(false);
      loadData(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (promo: PromoCodeItem) => {
    if (isViewer) return;
    setActionLoadingId(promo.id);
    try {
      await adminApiClient(`/platform/promos/${promo.id}/toggle`, {
        method: 'PATCH',
      });
      setSuccessMessage(`Promo '${promo.code}' status toggled to ${!promo.isActive ? 'Active' : 'Inactive'}.`);
      loadData(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle promo status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete promo
  const handleDeletePromo = async () => {
    if (!deleteConfirmPromo || isViewer) return;
    setActionLoadingId(deleteConfirmPromo.id);
    try {
      await adminApiClient(`/platform/promos/${deleteConfirmPromo.id}`, {
        method: 'DELETE',
      });
      setSuccessMessage(`Promo code '${deleteConfirmPromo.code}' deleted.`);
      setDeleteConfirmPromo(null);
      loadData(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Cannot delete promo code.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Customer / Merchant Tracking Drawer
  const handleOpenTracking = async (promo: PromoCodeItem) => {
    setSelectedPromoForTracking(promo);
    setTrackingModalOpen(true);
    setIsRedemptionsLoading(true);
    try {
      const res = await adminApiClient<{ data: RedemptionItem[]; meta: any }>(
        `/platform/promos/${promo.id}/redemptions?limit=100`,
      );
      setRedemptions(res?.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load merchant redemptions.');
    } finally {
      setIsRedemptionsLoading(false);
    }
  };

  // Filter promos
  const filteredPromos = promos.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.affiliatePartnerName &&
        p.affiliatePartnerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'ALL' || p.discountType === filterType;

    let matchesStatus = true;
    if (filterStatus === 'ACTIVE') matchesStatus = p.isActive && !p.isExpired && !p.isExhausted;
    else if (filterStatus === 'INACTIVE') matchesStatus = !p.isActive;
    else if (filterStatus === 'EXPIRED') matchesStatus = p.isExpired;
    else if (filterStatus === 'EXHAUSTED') matchesStatus = p.isExhausted;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-950 border border-amber-800 rounded-xl text-amber-400">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Promo Codes & Customer Tracking
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage onboarding acquisition codes, track customer signups, affiliate commissions, and monthly subscription gains.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition flex items-center space-x-2 disabled:opacity-50"
              title="Refresh promo data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>

            {!isViewer && (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold text-sm rounded-xl transition shadow-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Promo Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Alerts */}
        {errorMessage && (
          <div className="p-4 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI / Metric Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Active Promos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Promos</span>
              <div className="p-2 bg-amber-950 border border-amber-800 rounded-lg text-amber-400">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {summaryStats?.activePromos ?? 0}{' '}
                <span className="text-xs font-normal text-slate-400">/ {summaryStats?.totalPromos ?? 0} total</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Available for new registrations</p>
            </div>
          </div>

          {/* Merchants Acquired */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Merchants Acquired</span>
              <div className="p-2 bg-teal-950 border border-teal-800 rounded-lg text-teal-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-300">
                {summaryStats?.totalMerchantsAcquired ?? 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {summaryStats?.totalRedemptions ?? 0} total promo redemptions
              </p>
            </div>
          </div>

          {/* Total Realized Revenue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Realized Revenue</span>
              <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                LKR {(summaryStats?.totalRealizedRevenue ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                LKR {(summaryStats?.totalDiscountsGranted ?? 0).toLocaleString()} discounts granted
              </p>
            </div>
          </div>

          {/* Monthly Run-Rate Gains (MRR) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring Gains</span>
              <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                LKR {(summaryStats?.estimatedMonthlyGains ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                From active customers acquired via promo codes
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by promo code, description, or affiliate partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Discount Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount (LKR)</option>
              <option value="EXTRA_TRIAL_DAYS">Extra Trial Days</option>
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active & Available</option>
              <option value="INACTIVE">Deactivated</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXHAUSTED">Quota Exhausted</option>
            </select>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Promotional Codes</span>
              <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-mono">
                {filteredPromos.length}
              </span>
            </div>
            {isViewer && (
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                Viewer Role: Read Only
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Loading promotional codes and analytics...</p>
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
              <Tag className="w-12 h-12 text-slate-700 stroke-1" />
              <p className="text-base font-semibold text-slate-300">No promo codes found</p>
              <p className="text-xs max-w-md text-slate-500">
                {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
                  ? 'No promo codes match your current filter parameters. Try clearing the search query.'
                  : 'Get started by creating your first promotional code to attract new merchants.'}
              </p>
              {!isViewer && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-2 px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl hover:bg-emerald-600 transition"
                >
                  Create Promo Code
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Promo Code & Description</th>
                    <th className="py-3.5 px-4">Discount Offer</th>
                    <th className="py-3.5 px-4">Usage / Limit</th>
                    <th className="py-3.5 px-4">Acquired Merchants</th>
                    <th className="py-3.5 px-4">Realized Revenue</th>
                    <th className="py-3.5 px-4">Partner & Commission</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-normal">
                  {filteredPromos.map((promo) => {
                    const usagePercent = promo.maxUses ? Math.min(100, Math.round((promo.usedCount / promo.maxUses) * 100)) : null;

                    return (
                      <tr key={promo.id} className="hover:bg-slate-800/40 transition">
                        {/* Code & Description */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-white tracking-wider bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-lg select-all">
                              {promo.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(promo.code)}
                              className="p-1 text-slate-400 hover:text-white transition"
                              title="Copy code"
                            >
                              {copiedCode === promo.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {promo.description && (
                            <p className="text-xs text-slate-400 mt-1 max-w-xs truncate" title={promo.description}>
                              {promo.description}
                            </p>
                          )}
                        </td>

                        {/* Discount Offer */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {promo.discountType === 'PERCENTAGE' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 border border-emerald-800 text-emerald-400">
                              {promo.discountValue}% OFF
                            </span>
                          )}
                          {promo.discountType === 'FIXED_AMOUNT' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-950 border border-teal-800 text-teal-400">
                              LKR {promo.discountValue.toLocaleString()} OFF
                            </span>
                          )}
                          {promo.discountType === 'EXTRA_TRIAL_DAYS' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950 border border-amber-800 text-amber-400">
                              +{promo.discountValue} Trial Days
                            </span>
                          )}
                        </td>

                        {/* Usage / Limit */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">{promo.usedCount}</span>
                              <span className="text-slate-400">
                                {promo.maxUses ? `/ ${promo.maxUses}` : '/ Unlimited'}
                              </span>
                            </div>
                            {usagePercent !== null && (
                              <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    usagePercent >= 100
                                      ? 'bg-rose-500'
                                      : usagePercent > 80
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Acquired Merchants */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenTracking(promo)}
                            className="flex items-center space-x-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold group cursor-pointer"
                          >
                            <span>{promo.stats.activeMerchantsAcquired} active</span>
                            <span className="text-slate-500 font-normal">({promo.stats.totalRedemptions} total)</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                          </button>
                        </td>

                        {/* Realized Revenue */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-400">
                            LKR {promo.stats.totalRealizedRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">
                            -LKR {promo.stats.totalDiscountGiven.toLocaleString()} disc
                          </div>
                        </td>

                        {/* Partner & Commission */}
                        <td className="py-4 px-4">
                          {promo.affiliatePartnerName ? (
                            <div>
                              <div className="text-xs font-medium text-white flex items-center space-x-1">
                                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{promo.affiliatePartnerName}</span>
                              </div>
                              <div className="text-xs text-amber-400">
                                {promo.commissionRatePercent ?? 0}% rate (LKR {promo.stats.totalCommissionEarned.toLocaleString()})
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Platform Direct</span>
                          )}
                        </td>

                        {/* Validity */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                          {promo.validUntil ? (
                            <div>
                              <span>Until {new Date(promo.validUntil).toLocaleDateString()}</span>
                              {promo.isExpired && (
                                <span className="block text-rose-400 font-semibold text-[10px]">EXPIRED</span>
                              )}
                            </div>
                          ) : (
                            <span>Never expires</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {!promo.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
                              Inactive
                            </span>
                          ) : promo.isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-950 text-rose-400 border border-rose-800">
                              Expired
                            </span>
                          ) : promo.isExhausted ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950 text-amber-400 border border-amber-800">
                              Exhausted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Customer Tracking Button */}
                            <button
                              onClick={() => handleOpenTracking(promo)}
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-teal-500 text-teal-400 rounded-lg transition"
                              title="Track acquired merchants"
                            >
                              <Users className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            {!isViewer && (
                              <button
                                onClick={() => handleOpenEdit(promo)}
                                className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg transition"
                                title="Edit promo code"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}

                            {/* Toggle Active Button */}
                            {!isViewer && (
                              <button
                                onClick={() => handleToggleStatus(promo)}
                                disabled={actionLoadingId === promo.id}
                                className={`p-1.5 bg-slate-950 border rounded-lg transition ${
                                  promo.isActive
                                    ? 'border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-700'
                                    : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                                }`}
                                title={promo.isActive ? 'Deactivate promo' : 'Activate promo'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {!isViewer && (
                              <button
                                onClick={() => setDeleteConfirmPromo(promo)}
                                disabled={promo.usedCount > 0}
                                className={`p-1.5 bg-slate-950 border rounded-lg transition ${
                                  promo.usedCount > 0
                                    ? 'border-slate-900 text-slate-700 cursor-not-allowed'
                                    : 'border-slate-800 text-rose-400 hover:border-rose-700 hover:bg-rose-950'
                                }`}
                                title={
                                  promo.usedCount > 0
                                    ? 'Cannot delete promo with existing customer redemptions'
                                    : 'Delete unused promo'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PROMO CODE                                           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">
                  {editingPromo ? `Edit Promo Code '${editingPromo.code}'` : 'Create New Promotional Code'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Promo Code & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Promo Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER2026, PARTNER50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Merchants enter this unique code during self-onboarding registration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description / Campaign Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer launch campaign 20% discount on initial billing"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as PromoDiscountType })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (LKR)</option>
                    <option value="EXTRA_TRIAL_DAYS">Extra Trial Days (Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0.01}
                      max={formData.discountType === 'PERCENTAGE' ? 100 : 9999999}
                      step={formData.discountType === 'EXTRA_TRIAL_DAYS' ? 1 : 0.01}
                      placeholder={
                        formData.discountType === 'PERCENTAGE'
                          ? '20'
                          : formData.discountType === 'FIXED_AMOUNT'
                          ? '5000'
                          : '30'
                      }
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                      {formData.discountType === 'PERCENTAGE'
                        ? '%'
                        : formData.discountType === 'FIXED_AMOUNT'
                        ? 'LKR'
                        : 'Days'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Max Uses & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Expires On (Valid Until)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Affiliate & Commission */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Affiliate / Partner Attribution (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Partner / Agency Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lanka Tech Marketing"
                      value={formData.affiliatePartnerName}
                      onChange={(e) => setFormData({ ...formData, affiliatePartnerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Partner Commission (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="e.g. 15"
                      value={formData.commissionRatePercent}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionRatePercent: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-sm font-semibold text-white">Status: Active</span>
                  <p className="text-xs text-slate-400">
                    If active, merchants can apply this promo code during onboarding.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingPromo ? 'Save Changes' : 'Create Promo Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: CUSTOMER TRACKING & REDEMPTIONS                           */}
      {/* ========================================================================= */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-950 border border-teal-800 rounded-xl text-teal-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-white">Customer Acquisition Tracking</h3>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                      {selectedPromoForTracking?.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    All retail merchants acquired via this promotional code, subscription status, and revenue gains.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTrackingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Total Redemptions</span>
                <span className="text-base font-bold text-white">{redemptions.length}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Discounts Granted</span>
                <span className="text-base font-bold text-amber-400">
                  LKR {redemptions.reduce((acc, r) => acc + r.discountAmount, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Realized Revenue</span>
                <span className="text-base font-bold text-emerald-400">
                  LKR {redemptions.reduce((acc, r) => acc + r.invoiceAmountAfterDiscount, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Affiliate Commission</span>
                <span className="text-base font-bold text-cyan-400">
                  LKR {redemptions.reduce((acc, r) => acc + (r.commissionEarned || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Redemptions Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {isRedemptionsLoading ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
                  <p className="text-sm font-medium">Retrieving customer acquisition records...</p>
                </div>
              ) : redemptions.length === 0 ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Users className="w-10 h-10 text-slate-700 stroke-1" />
                  <p className="text-sm font-semibold text-slate-300">No redemptions yet</p>
                  <p className="text-xs text-slate-500">
                    No merchants have registered with this promotional code yet.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Merchant</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3">Subscription Tier</th>
                        <th className="py-3 px-3">Invoice & Discount</th>
                        <th className="py-3 px-3">Paid Amount</th>
                        <th className="py-3 px-3">Commission</th>
                        <th className="py-3 px-3">Date Redeemed</th>
                        <th className="py-3 px-3 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-normal">
                      {redemptions.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          {/* Merchant */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-sm">{item.merchant.businessName}</div>
                            <div className="font-mono text-slate-400 text-[11px]">{item.merchant.code}</div>
                            <span
                              className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                item.merchant.status === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {item.merchant.status}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3">
                            <div className="text-slate-200">{item.merchant.contactEmail}</div>
                            <div className="text-slate-400 text-[11px]">{item.merchant.contactPhone}</div>
                          </td>

                          {/* Subscription Tier */}
                          <td className="py-3 px-3">
                            {item.plan ? (
                              <div>
                                <span className="font-semibold text-white">{item.plan.name}</span>
                                <div className="text-slate-400 text-[11px]">
                                  {item.plan.billingCycle} • {item.plan.status}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">Standard Plan</span>
                            )}
                          </td>

                          {/* Invoice & Discount */}
                          <td className="py-3 px-3">
                            <div className="text-slate-400 line-through">
                              LKR {item.invoiceAmountBeforeDiscount.toLocaleString()}
                            </div>
                            <div className="text-amber-400 font-semibold">
                              -LKR {item.discountAmount.toLocaleString()}
                              {item.extraTrialDaysApplied ? ` (+${item.extraTrialDaysApplied}d trial)` : ''}
                            </div>
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-emerald-400">
                              LKR {item.invoiceAmountAfterDiscount.toLocaleString()}
                            </div>
                            {item.invoice && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.invoice.invoiceNumber} ({item.invoice.status})
                              </span>
                            )}
                          </td>

                          {/* Commission */}
                          <td className="py-3 px-3">
                            {item.commissionEarned > 0 ? (
                              <span className="font-semibold text-cyan-400">
                                LKR {item.commissionEarned.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>

                          {/* Date Redeemed */}
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(item.redeemedAt).toLocaleDateString()}
                            <div className="text-[10px] text-slate-500">
                              {new Date(item.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* View Link */}
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/merchants/${item.merchant.id}`}
                              target="_blank"
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-teal-500 text-teal-400 rounded-lg inline-flex items-center space-x-1"
                              title="Open Merchant in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Displaying {redemptions.length} acquisition records
              </span>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {deleteConfirmPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete Promo Code</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to permanently delete promo code{' '}
              <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {deleteConfirmPromo.code}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPromo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePromo}
                disabled={actionLoadingId === deleteConfirmPromo.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 flex items-center space-x-2"
              >
                {actionLoadingId === deleteConfirmPromo.id && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
