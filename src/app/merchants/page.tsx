'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Ban,
  RefreshCw,
  Plus,
  Pencil,
  Store,
  X,
  Search,
  Building2,
  AlertCircle,
  Check,
  RotateCcw,
  Mail,
  Phone,
  Sliders,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SearchX,
  FilterX,
  Eye,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

interface Plan {
  id: string;
  name: string;
  code: string;
  monthlyPrice: number | string;
  annualPrice: number | string;
  maxBranches: number;
  maxWarehouses: number;
  maxUsers: number;
  isActive: boolean;
}

interface MerchantBranch {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  terminalsCount?: number;
  salesCount?: number;
}

export default function MerchantsManagementPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
  const isViewer = user?.role === 'PLATFORM_VIEWER';

  // Data & Pagination State
  const [merchants, setMerchants] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Loading & Feedback States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerForm, setRegisterForm] = useState({
    businessName: '',
    tradeName: '',
    taxNumber: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    planId: '',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
    branchName: 'Main Flagship Store',
    branchCode: 'MAIN',
    branchAddress: '',
    branchPhone: '',
  });

  // Edit Merchant Modal State
  const [editingMerchant, setEditingMerchant] = useState<any | null>(null);
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

  // Shops / Branches Drawer/Modal State
  const [selectedMerchantForBranches, setSelectedMerchantForBranches] = useState<any | null>(null);
  const [branches, setBranches] = useState<MerchantBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);
  const [branchActionLoading, setBranchActionLoading] = useState<string | null>(null);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<MerchantBranch | null>(null);
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

  // Fetch available subscription plans
  const fetchPlans = async () => {
    try {
      const res = await adminApiClient<Plan[]>('/platform/plans');
      const planList = Array.isArray(res) ? res : (res as any)?.items || [];
      setPlans(planList);
      if (planList.length > 0 && !registerForm.planId) {
        setRegisterForm((prev) => ({ ...prev, planId: planList[0].id }));
      }
    } catch (err) {
      console.warn('Fetch plans error:', err);
    }
  };

  // Fetch merchants with pagination and filter params
  const fetchMerchants = useCallback(
    async (overridePage?: number, overrideLimit?: number, overrideStatus?: string, overrideSearch?: string) => {
      const targetPage = overridePage ?? page;
      const targetLimit = overrideLimit ?? limit;
      const targetStatus = overrideStatus !== undefined ? overrideStatus : statusFilter;
      const targetSearch = overrideSearch !== undefined ? overrideSearch : activeSearch;

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams();
        params.append('page', String(targetPage));
        params.append('limit', String(targetLimit));
        if (targetStatus) params.append('status', targetStatus);
        if (targetSearch.trim()) params.append('search', targetSearch.trim());

        const res = await adminApiClient<any>(`/platform/merchants?${params.toString()}`);

        const items = Array.isArray(res) ? res : res?.items || [];
        const meta = res?.meta || {};

        setMerchants(items);

        const fallbackTotal = typeof meta.total === 'number' ? meta.total : items.length;
        const computedPages = typeof meta.totalPages === 'number' ? meta.totalPages : Math.ceil(fallbackTotal / targetLimit);
        setTotalCount(fallbackTotal);
        setTotalPages(computedPages || 1);
      } catch (err: any) {
        console.warn('Fetch merchants error:', err);
        setErrorMessage(err.message || 'Failed to load merchants');
        setMerchants([]);
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, statusFilter, activeSearch],
  );

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  // Handle Clear Search and Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setStatusFilter('');
    setPage(1);
  };

  // Handle Filter Pill Change
  const handleStatusFilterChange = (st: string) => {
    setStatusFilter(st);
    setPage(1);
  };

  // Handle Page Size Change
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // --- ACTIONS ---
  const handleApprove = async (id: string) => {
    setIsActionLoading(id);
    try {
      await adminApiClient(`/platform/merchants/${id}/approve`, { method: 'POST' });
      setSuccessMessage('Merchant organization approved successfully.');
      await fetchMerchants();
    } catch (err: any) {
      setErrorMessage(`Approval failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this merchant organization? All active user sessions will be terminated.')) return;
    setIsActionLoading(id);
    try {
      await adminApiClient(`/platform/merchants/${id}/suspend`, {
        method: 'POST',
        body: { reason: 'Administrative suspension' },
      });
      setSuccessMessage('Merchant organization suspended.');
      await fetchMerchants();
    } catch (err: any) {
      setErrorMessage(`Suspension failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setIsActionLoading(id);
    try {
      await adminApiClient(`/platform/merchants/${id}/reactivate`, { method: 'POST' });
      setSuccessMessage('Merchant organization reactivated.');
      await fetchMerchants();
    } catch (err: any) {
      setErrorMessage(`Reactivation failed: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- REGISTER MERCHANT ---
  const handleOpenRegisterModal = () => {
    setRegisterForm({
      businessName: '',
      tradeName: '',
      taxNumber: '',
      contactEmail: '',
      contactPhone: '',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      planId: plans[0]?.id || '',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      ownerFirstName: '',
      ownerLastName: '',
      ownerEmail: '',
      ownerPassword: '',
      branchName: 'Main Store',
      branchCode: 'MAIN',
      branchAddress: '',
      branchPhone: '',
    });
    setErrorMessage(null);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.businessName || !registerForm.contactEmail || !registerForm.contactPhone || !registerForm.ownerPassword) {
      alert('Please fill in all required fields (Business Name, Contact Email, Contact Phone, and Owner Password).');
      return;
    }
    if (!registerForm.planId && plans.length > 0) {
      alert('Please select a subscription plan.');
      return;
    }

    setIsActionLoading('register');
    setErrorMessage(null);
    try {
      const payload: any = {
        businessName: registerForm.businessName.trim(),
        tradeName: registerForm.tradeName.trim() || undefined,
        taxNumber: registerForm.taxNumber.trim() || undefined,
        contactEmail: registerForm.contactEmail.trim().toLowerCase(),
        contactPhone: registerForm.contactPhone.trim(),
        currency: registerForm.currency,
        timezone: registerForm.timezone,
        planId: registerForm.planId || plans[0]?.id,
        billingCycle: registerForm.billingCycle,
        status: registerForm.status,
        ownerFirstName: registerForm.ownerFirstName.trim() || 'Owner',
        ownerLastName: registerForm.ownerLastName.trim() || 'Admin',
        ownerEmail: registerForm.ownerEmail.trim() ? registerForm.ownerEmail.trim().toLowerCase() : undefined,
        ownerPassword: registerForm.ownerPassword,
        branchName: registerForm.branchName.trim() || 'Main Branch',
        branchCode: registerForm.branchCode.trim() || 'MAIN',
        branchAddress: registerForm.branchAddress.trim() || undefined,
        branchPhone: registerForm.branchPhone.trim() || undefined,
      };

      await adminApiClient('/platform/merchants', {
        method: 'POST',
        body: payload,
      });

      setIsRegisterModalOpen(false);
      setSuccessMessage(`Merchant "${payload.businessName}" created and onboarded successfully.`);
      await fetchMerchants(1, limit, statusFilter, activeSearch);
    } catch (err: any) {
      setErrorMessage(`Failed to register merchant: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- EDIT MERCHANT ---
  const handleOpenEditModal = (m: any) => {
    const activeSub = m.subscriptions?.[0] || m.plan;
    setEditingMerchant(m);
    setEditForm({
      businessName: m.businessName || '',
      tradeName: m.tradeName || '',
      taxNumber: m.taxNumber || '',
      contactEmail: m.contactEmail || '',
      contactPhone: m.contactPhone || '',
      currency: m.currency || 'LKR',
      timezone: m.timezone || 'Asia/Colombo',
      planId: activeSub?.planId || activeSub?.id || plans[0]?.id || '',
      billingCycle: activeSub?.billingCycle || 'MONTHLY',
      subscriptionStatus: activeSub?.status || 'ACTIVE',
      status: m.status || 'ACTIVE',
    });
    setErrorMessage(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;

    setIsActionLoading(`edit-${editingMerchant.id}`);
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

      await adminApiClient(`/platform/merchants/${editingMerchant.id}`, {
        method: 'PUT',
        body: payload,
      });

      setEditingMerchant(null);
      setSuccessMessage(`Merchant "${payload.businessName}" updated successfully.`);
      await fetchMerchants();
    } catch (err: any) {
      setErrorMessage(`Failed to update merchant: ${err.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  // --- MANAGE SHOPS / BRANCHES ---
  const handleOpenBranches = async (m: any) => {
    setSelectedMerchantForBranches(m);
    setIsAddBranchOpen(false);
    setEditingBranch(null);
    setIsLoadingBranches(true);
    setErrorMessage(null);
    try {
      const res = await adminApiClient<MerchantBranch[]>(`/platform/merchants/${m.id}/branches`);
      setBranches(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setErrorMessage(`Failed to load branches: ${err.message}`);
      setBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchantForBranches) return;
    if (!branchForm.code || !branchForm.name) {
      alert('Branch Code and Branch Name are required.');
      return;
    }

    setBranchActionLoading('create');
    try {
      await adminApiClient(`/platform/merchants/${selectedMerchantForBranches.id}/branches`, {
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

      setIsAddBranchOpen(false);
      setBranchForm({ code: '', name: '', address: '', phone: '', isMain: false, isActive: true });
      // reload branches
      const res = await adminApiClient<MerchantBranch[]>(`/platform/merchants/${selectedMerchantForBranches.id}/branches`);
      setBranches(Array.isArray(res) ? res : []);
      await fetchMerchants();
      setSuccessMessage('Shop/Branch created successfully.');
    } catch (err: any) {
      alert(`Failed to add branch: ${err.message}`);
    } finally {
      setBranchActionLoading(null);
    }
  };

  const handleEditBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchantForBranches || !editingBranch) return;

    setBranchActionLoading(`update-${editingBranch.id}`);
    try {
      await adminApiClient(`/platform/merchants/${selectedMerchantForBranches.id}/branches/${editingBranch.id}`, {
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

      setEditingBranch(null);
      const res = await adminApiClient<MerchantBranch[]>(`/platform/merchants/${selectedMerchantForBranches.id}/branches`);
      setBranches(Array.isArray(res) ? res : []);
      await fetchMerchants();
      setSuccessMessage('Shop/Branch updated successfully.');
    } catch (err: any) {
      alert(`Failed to update branch: ${err.message}`);
    } finally {
      setBranchActionLoading(null);
    }
  };

  // Helper values for pagination display
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);
  const hasActiveFilters = Boolean(statusFilter || activeSearch);

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
              You are signed in as a <strong>Platform Viewer</strong>. You have read-only authority to inspect merchants, store branches, and invoices. Creation and modification actions are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchant & Store Directory</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Provision organizations, edit merchant configurations, and manage multiple shops/branches
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {!isViewer && (
            <button
              onClick={handleOpenRegisterModal}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Merchant</span>
            </button>
          )}

          <button
            onClick={() => fetchMerchants()}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition disabled:opacity-50"
            title="Refresh Merchants"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          {[
            { key: '', label: 'ALL MERCHANTS' },
            { key: 'PENDING_APPROVAL', label: 'PENDING APPROVAL' },
            { key: 'ACTIVE', label: 'ACTIVE' },
            { key: 'SUSPENDED', label: 'SUSPENDED' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusFilterChange(key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                statusFilter === key
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search code, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Search
            </button>
          </form>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1"
              title="Reset search and filters"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Merchant Table & Content States */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Merchant Code</th>
                <th className="py-3 px-4">Business Details</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Plan & Billing</th>
                <th className="py-3 px-4 text-center">Stores / Shops</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {/* 1. LOADING SKELETON STATE */}
              {isLoading ? (
                Array.from({ length: limit > 5 ? 5 : limit }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-20 bg-slate-800 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1.5">
                      <div className="h-4 w-36 bg-slate-800 rounded"></div>
                      <div className="h-3 w-24 bg-slate-800 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-800 rounded"></div>
                      <div className="h-3 w-24 bg-slate-800 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="h-4 w-16 bg-slate-800 rounded"></div>
                      <div className="h-3 w-20 bg-slate-800 rounded"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-7 w-20 bg-slate-800 rounded-lg mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-5 w-16 bg-slate-800 rounded-full mx-auto"></div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-7 w-16 bg-slate-800 rounded-lg ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : merchants.length === 0 ? (
                /* 2. NOT FOUND OR EMPTY STATE */
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center">
                    {hasActiveFilters ? (
                      /* NOT FOUND STATE */
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto border border-slate-700">
                          <SearchX className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">No merchants match your criteria</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We couldn't find any merchant matching {activeSearch && <span className="text-emerald-300 font-mono">"{activeSearch}"</span>} {statusFilter && <span>with status <span className="text-amber-400 font-bold">{statusFilter}</span></span>}.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                          >
                            <FilterX className="w-3.5 h-3.5" />
                            <span>Clear Search & Filters</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* GENUINE EMPTY STATE */
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800 shadow-lg shadow-emerald-950">
                          <Building2 className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-white">No merchant organizations registered</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Your platform tenant registry is empty. Provision your first merchant organization along with its initial store location and owner credentials.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={handleOpenRegisterModal}
                            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Register First Merchant</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                /* 3. NORMAL DATA ROWS */
                merchants.map((m) => {
                  const activeSub = m.subscriptions?.[0] || m.plan;
                  const planName = activeSub?.name || activeSub?.plan?.name || 'BASIC';
                  const billingCycle = activeSub?.billingCycle || 'MONTHLY';
                  const shopCount = m.counts?.branches ?? m._count?.branches ?? m.branches?.length ?? 1;

                  const now = new Date();
                  const subEndDate = activeSub?.endDate ? new Date(activeSub.endDate) : null;
                  const isSubExpired = Boolean(
                    activeSub &&
                      (activeSub.status === 'EXPIRED' ||
                        activeSub.status === 'CANCELLED' ||
                        (subEndDate && subEndDate < now)),
                  );
                  const subRemainingDays = subEndDate
                    ? Math.ceil((subEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon =
                    !isSubExpired &&
                    subRemainingDays !== null &&
                    subRemainingDays <= 7 &&
                    subRemainingDays >= 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-850 transition">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold">
                        <Link
                          href={`/merchants/${m.id}`}
                          className="text-emerald-400 hover:text-emerald-300 hover:underline transition"
                          title="View complete merchant profile"
                        >
                          {m.code}
                        </Link>
                      </td>

                      {/* Business */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/merchants/${m.id}`}
                          className="font-semibold text-white hover:text-emerald-300 text-sm transition block"
                          title="View complete merchant profile"
                        >
                          {m.businessName}
                        </Link>
                        {m.tradeName && (
                          <div className="text-slate-400 text-[11px]">Trade: {m.tradeName}</div>
                        )}
                        {m.taxNumber && (
                          <div className="text-slate-500 text-[10px] font-mono">Tax: {m.taxNumber}</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{m.contactEmail}</span>
                        </div>
                        {m.contactPhone && (
                          <div className="flex items-center space-x-1 text-slate-400 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{m.contactPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Plan & Subscription Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="inline-block bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {planName}
                          </span>
                          {isSubExpired ? (
                            <span className="inline-block bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-block bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                              {subRemainingDays === 0 ? 'Due Today' : `${subRemainingDays}d left`}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 uppercase">
                          {billingCycle} • {m.currency || 'LKR'}
                        </div>
                      </td>

                      {/* Shops count & Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenBranches(m)}
                          className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                          title="View and manage shops/branches"
                        >
                          <Store className="w-3.5 h-3.5 text-sky-400" />
                          <span className="font-semibold">{shopCount} {shopCount === 1 ? 'Shop' : 'Shops'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : m.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View details page */}
                          <Link
                            href={`/merchants/${m.id}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-700 transition"
                            title="View Complete Merchant Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {!isViewer && (
                            <>
                              {/* Edit button */}
                              <button
                                onClick={() => handleOpenEditModal(m)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                                title="Edit Merchant"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Approve button */}
                              {m.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApprove(m.id)}
                                  disabled={isActionLoading === m.id}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition inline-flex items-center space-x-1"
                                  title="Approve organization"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Suspend button */}
                              {m.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleSuspend(m.id)}
                                  disabled={isActionLoading === m.id}
                                  className="bg-rose-900 hover:bg-rose-800 text-rose-200 border border-rose-700 font-bold text-xs px-2 py-1.5 rounded-lg transition inline-flex items-center space-x-1"
                                  title="Suspend organization"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Suspend</span>
                                </button>
                              )}

                              {/* Reactivate button */}
                              {m.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleReactivate(m.id)}
                                  disabled={isActionLoading === m.id}
                                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition inline-flex items-center space-x-1"
                                  title="Reactivate organization"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reactivate</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* PAGINATION TOOLBAR                                       */}
        {/* ======================================================== */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          {/* Summary */}
          <div className="flex items-center space-x-2">
            <span>
              Showing <strong className="text-white">{startItem}</strong> to{' '}
              <strong className="text-white">{endItem}</strong> of{' '}
              <strong className="text-white">{totalCount}</strong> merchants
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">
                Filtered
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Limit Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Per page:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center space-x-1">
              {/* First Page */}
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1 || isLoading}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-400 hover:text-white transition"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-400 hover:text-white transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Indicator */}
              <div className="px-2 py-0.5 text-xs font-semibold text-slate-300">
                Page <span className="text-emerald-400">{page}</span> of {totalPages || 1}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-400 hover:text-white transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || isLoading}
                className="p-1 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-400 hover:text-white transition"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. REGISTER NEW MERCHANT MODAL                            */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Register New Merchant Organization</h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Business Details */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-800">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Organization & Contact Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Business Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Supermarket Pvt Ltd"
                      value={registerForm.businessName}
                      onChange={(e) => setRegisterForm({ ...registerForm, businessName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Trade / Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Mart"
                      value={registerForm.tradeName}
                      onChange={(e) => setRegisterForm({ ...registerForm, tradeName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tax / BRN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PV-123456"
                      value={registerForm.taxNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, taxNumber: e.target.value })}
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
                      placeholder="e.g. contact@apexmart.lk"
                      value={registerForm.contactEmail}
                      onChange={(e) => setRegisterForm({ ...registerForm, contactEmail: e.target.value })}
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
                      placeholder="e.g. +94771234567"
                      value={registerForm.contactPhone}
                      onChange={(e) => setRegisterForm({ ...registerForm, contactPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                      <select
                        value={registerForm.currency}
                        onChange={(e) => setRegisterForm({ ...registerForm, currency: e.target.value })}
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
                        value={registerForm.timezone}
                        onChange={(e) => setRegisterForm({ ...registerForm, timezone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Subscription Plan */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-800">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Subscription Tier & Quota</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subscription Plan <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={registerForm.planId}
                      onChange={(e) => setRegisterForm({ ...registerForm, planId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — {p.maxBranches} shops / {p.maxUsers} users
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Cycle</label>
                    <select
                      value={registerForm.billingCycle}
                      onChange={(e) => setRegisterForm({ ...registerForm, billingCycle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="MONTHLY">Monthly Billing</option>
                      <option value="ANNUALLY">Annual Billing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                    <select
                      value={registerForm.status}
                      onChange={(e) => setRegisterForm({ ...registerForm, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ACTIVE">ACTIVE (Ready immediately)</option>
                      <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Owner Account */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-800">
                  <Users className="w-3.5 h-3.5" />
                  <span>Merchant Owner Account (Primary Admin)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner First Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samantha"
                      value={registerForm.ownerFirstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerFirstName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Last Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fernando"
                      value={registerForm.ownerLastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerLastName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Login Email (leave blank to use contact email)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. samantha@apexmart.lk"
                      value={registerForm.ownerEmail}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Initial Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={registerForm.ownerPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerPassword: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Initial Shop / Branch */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-800">
                  <Store className="w-3.5 h-3.5" />
                  <span>Initial Shop / Branch</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Shop / Branch Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Flagship Store"
                      value={registerForm.branchName}
                      onChange={(e) => setRegisterForm({ ...registerForm, branchName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Code</label>
                    <input
                      type="text"
                      placeholder="e.g. MAIN or BR-01"
                      value={registerForm.branchCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, branchCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 100 Galle Road, Colombo 03"
                      value={registerForm.branchAddress}
                      onChange={(e) => setRegisterForm({ ...registerForm, branchAddress: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Store Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. +94112345678"
                      value={registerForm.branchPhone}
                      onChange={(e) => setRegisterForm({ ...registerForm, branchPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === 'register'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === 'register' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isActionLoading === 'register' ? 'Provisioning...' : 'Provision & Register Merchant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EDIT MERCHANT MODAL                                   */}
      {/* ======================================================== */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Edit Merchant Profile: <span className="text-emerald-400">{editingMerchant.code}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingMerchant(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
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

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMerchant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading === `edit-${editingMerchant.id}`}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {isActionLoading === `edit-${editingMerchant.id}` && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{isActionLoading === `edit-${editingMerchant.id}` ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MANAGE SHOPS & BRANCHES MODAL                         */}
      {/* ======================================================== */}
      {selectedMerchantForBranches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Shops & Branches — {selectedMerchantForBranches.businessName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Merchant Code: <span className="font-mono text-emerald-400">{selectedMerchantForBranches.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchantForBranches(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header Bar within Modal */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Registered Stores ({branches.length})</h4>
                  <p className="text-xs text-slate-400">Manage store locations, POS terminals, and branch status</p>
                </div>
                {!isAddBranchOpen && !editingBranch && (
                  <button
                    onClick={() => {
                      setBranchForm({
                        code: `BR-0${branches.length + 1}`,
                        name: '',
                        address: '',
                        phone: '',
                        isMain: false,
                        isActive: true,
                      });
                      setIsAddBranchOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Shop</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Branch Sub-Form */}
              {(isAddBranchOpen || editingBranch) && (
                <div className="bg-slate-950 border border-emerald-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {editingBranch ? `Edit Shop: ${editingBranch.name}` : 'Register New Shop / Branch'}
                    </h5>
                    <button
                      onClick={() => {
                        setIsAddBranchOpen(false);
                        setEditingBranch(null);
                      }}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={editingBranch ? handleEditBranchSubmit : handleAddBranchSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-mono"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Store Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 50 Colombo Road, Kandy"
                          value={branchForm.address}
                          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Store Phone</label>
                        <input
                          type="tel"
                          placeholder="e.g. +94812345678"
                          value={branchForm.phone}
                          onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs text-slate-300 pt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={branchForm.isMain}
                          onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span>Set as Main Headquarter Branch</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={branchForm.isActive}
                          onChange={(e) => setBranchForm({ ...branchForm, isActive: e.target.checked })}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span>Active</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddBranchOpen(false);
                          setEditingBranch(null);
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!!branchActionLoading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1"
                      >
                        {branchActionLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>{editingBranch ? 'Save Branch' : 'Create Branch'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Branches Table with Skeletons and Empty State */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Store Name</th>
                      <th className="py-2.5 px-3">Contact & Address</th>
                      <th className="py-2.5 px-3 text-center">POS Terminals</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {isLoadingBranches ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={`branch-skeleton-${idx}`} className="animate-pulse">
                          <td className="py-2.5 px-3">
                            <div className="h-4 w-12 bg-slate-800 rounded"></div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="h-4 w-28 bg-slate-800 rounded"></div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="h-3.5 w-36 bg-slate-800 rounded"></div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="h-4 w-8 bg-slate-800 rounded mx-auto"></div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="h-4 w-14 bg-slate-800 rounded-full mx-auto"></div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="h-6 w-8 bg-slate-800 rounded ml-auto"></div>
                          </td>
                        </tr>
                      ))
                    ) : branches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          <Store className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="font-semibold text-slate-400">No branch locations registered yet</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Click "Add New Shop" above to configure stores for this merchant.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      branches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-900 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                            {b.code}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{b.name}</span>
                              {b.isMain && (
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                  HEADQUARTERS
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {b.address && <div>{b.address}</div>}
                            {b.phone && <div className="text-[11px] text-slate-500">{b.phone}</div>}
                            {!b.address && !b.phone && <span className="text-slate-600">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                            {b.terminalsCount ?? 0}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                b.isActive
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setEditingBranch(b);
                                setIsAddBranchOpen(false);
                                setBranchForm({
                                  code: b.code,
                                  name: b.name,
                                  address: b.address || '',
                                  phone: b.phone || '',
                                  isMain: b.isMain,
                                  isActive: b.isActive,
                                });
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                              title="Edit Branch"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedMerchantForBranches(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
