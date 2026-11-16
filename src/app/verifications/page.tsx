'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertCircle,
  Sparkles,
  X,
  CreditCard,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

interface VerificationItem {
  id: string;
  invoiceId: string;
  merchantId: string;
  gateway: string;
  transactionReference?: string | null;
  bankSlipUrl?: string | null;
  amountSubmitted: number | string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  merchant: {
    id: string;
    code: string;
    businessName: string;
    contactEmail: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number | string;
    currency: string;
    status: string;
  };
  reviewedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function PaymentVerificationsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAdminAuthStore();
  const isViewer = user?.role === 'PLATFORM_VIEWER';

  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Modals
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('Deposit verified against bank statement.');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Slip amount does not match invoice amount.');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        queryParams.set('status', statusFilter);
      }
      queryParams.set('page', String(page));
      queryParams.set('limit', '20');

      const url = `/platform/payments/verifications?${queryParams.toString()}`;
      const res = await adminApiClient<{ items: VerificationItem[]; meta: any }>(url);

      if (res && res.items) {
        setVerifications(res.items);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalCount(res.meta?.total || res.items.length);
      } else {
        setVerifications([]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch payment verifications:', err);
      // Fallback empty if database has no verifications yet
      setVerifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedItem || isViewer) return;
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      await adminApiClient(`/platform/payments/verifications/${selectedItem.id}/approve`, {
        method: 'POST',
        body: { notes: approveNotes },
      });
      setSuccessMessage(
        `Slip for merchant ${selectedItem.merchant.businessName} approved! Subscription renewed and invoice marked PAID.`,
      );
      setIsApproveModalOpen(false);
      setSelectedItem(null);
      fetchVerifications();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to approve verification.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedItem || isViewer) return;
    if (!rejectReason.trim()) {
      setErrorMessage('Please provide a reason for rejecting this deposit slip.');
      return;
    }
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      await adminApiClient(`/platform/payments/verifications/${selectedItem.id}/reject`, {
        method: 'POST',
        body: { reason: rejectReason.trim() },
      });
      setSuccessMessage(
        `Slip for merchant ${selectedItem.merchant.businessName} has been rejected. Reason logged for merchant.`,
      );
      setIsRejectModalOpen(false);
      setSelectedItem(null);
      fetchVerifications();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject verification.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter items client-side by search query
  const filteredItems = verifications.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.merchant.businessName.toLowerCase().includes(q) ||
      item.merchant.code.toLowerCase().includes(q) ||
      item.invoice.invoiceNumber.toLowerCase().includes(q) ||
      (item.transactionReference && item.transactionReference.toLowerCase().includes(q))
    );
  });

  // Calculate summary counts
  const pendingCount = verifications.filter((v) => v.status === 'PENDING_VERIFICATION').length;
  const approvedCount = verifications.filter((v) => v.status === 'APPROVED').length;
  const rejectedCount = verifications.filter((v) => v.status === 'REJECTED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bank Deposit Slip Verification Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase tracking-wider">
              Platform Billing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Review offline bank deposit slips submitted by merchants across Sri Lanka to renew subscriptions and clear invoices.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVerifications}
            disabled={isLoading}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
            title="Refresh verification queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isViewer && (
        <div className="p-4 bg-amber-950 border border-amber-800 rounded-2xl text-amber-300 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            You are signed in with the <strong>PLATFORM_VIEWER</strong> role. Slip approvals and rejections are disabled.
          </span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950 border border-rose-800 rounded-2xl text-rose-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Submissions</span>
            <FileCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">All recorded manual transfers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-teal-400">Pending Review</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-400 font-mono">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting admin statement check</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified & invoices settled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{rejectedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Mismatch or invalid slips</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl w-full md:w-auto">
          {(['ALL', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status === 'ALL'
                ? 'All Slips'
                : status === 'PENDING_VERIFICATION'
                ? 'Pending'
                : status === 'APPROVED'
                ? 'Approved'
                : 'Rejected'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search merchant, invoice #, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Submitted Amount</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Receipt Slip</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading payment verifications...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No payment verification requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isPending = item.status === 'PENDING_VERIFICATION';

                  return (
                    <tr key={item.id} className="hover:bg-slate-950/60 transition">
                      <td className="py-3 px-4">
                        <Link
                          href={`/merchants/${item.merchant.id}`}
                          className="font-bold text-white hover:text-emerald-400 transition flex items-center space-x-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{item.merchant.businessName}</span>
                        </Link>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {item.merchant.code} • {item.merchant.contactEmail}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {item.invoice?.invoiceNumber || item.invoiceId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-emerald-400">
                          {item.invoice?.currency || 'LKR'} {Number(item.amountSubmitted).toLocaleString()}
                        </div>
                        {item.invoice && (
                          <div className="text-[10px] text-slate-500">
                            Inv Total: {item.invoice.currency} {Number(item.invoice.amount).toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {item.transactionReference || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {item.bankSlipUrl ? (
                          <button
                            onClick={() => setPreviewImageUrl(item.bankSlipUrl!)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-400 hover:text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Slip</span>
                          </button>
                        ) : (
                          <span className="text-slate-500">No Image</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('en-GB')}
                        <span className="block text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {item.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase flex items-center space-x-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Approved</span>
                          </span>
                        ) : item.status === 'REJECTED' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase flex items-center space-x-1 w-max">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Rejected</span>
                            </span>
                            {item.notes && (
                              <div className="text-[10px] text-rose-400 max-w-xs truncate" title={item.notes}>
                                {item.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase flex items-center space-x-1 w-max">
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center space-x-2">
                            <button
                              disabled={isViewer}
                              onClick={() => {
                                setSelectedItem(item);
                                setIsApproveModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
                              title={isViewer ? 'Read-only viewer cannot approve' : 'Approve slip & renew'}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              disabled={isViewer}
                              onClick={() => {
                                setSelectedItem(item);
                                setIsRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 disabled:opacity-40 text-rose-300 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                              title={isViewer ? 'Read-only viewer cannot reject' : 'Reject slip with reason'}
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {item.reviewedBy ? `by ${item.reviewedBy.firstName}` : 'Reviewed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Bank Deposit Slip Document</h3>
              </div>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={previewImageUrl}
                alt="Deposit Slip Receipt"
                className="max-h-[65vh] max-w-full object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x400/0f172a/38bdf8?text=Bank+Slip+Preview';
                }}
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Open image in new window</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Slip Modal */}
      {isApproveModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Approve Deposit Slip</h3>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">{selectedItem.merchant.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono font-bold text-slate-200">{selectedItem.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted Amount:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedItem.invoice.currency} {Number(selectedItem.amountSubmitted).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Verification Approval Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-xs text-emerald-300 leading-relaxed">
              Approving will automatically mark the invoice <strong>PAID</strong> and extend the merchant&apos;s active subscription cycle.
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isActionLoading}
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <span>{isActionLoading ? 'Approving...' : 'Confirm Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Slip Modal */}
      {isRejectModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Reject Deposit Slip</h3>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">{selectedItem.merchant.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono font-bold text-slate-200">{selectedItem.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted Amount:</span>
                <span className="font-mono font-bold text-rose-400">
                  {selectedItem.invoice.currency} {Number(selectedItem.amountSubmitted).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Rejection Reason (Merchant will see this) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Deposit slip blurry or amount does not match statement"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isActionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <span>{isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
