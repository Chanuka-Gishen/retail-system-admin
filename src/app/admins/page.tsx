'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Search,
  EyeOff,
} from 'lucide-react';
import { adminApiClient } from '../../lib/api-client';
import { useAdminAuthStore } from '../../lib/auth-store';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const ROLE_INFO: Record<string, { label: string; color: string; desc: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'bg-teal-950 text-teal-300 border-teal-800',
    desc: 'Unrestricted master platform authority. Can provision admin users, modify billing, and alter plans.',
  },
  PLATFORM_ADMIN: {
    label: 'Platform Admin',
    color: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    desc: 'Full administrative rights to provision merchants, change plans, and verify payments.',
  },
  PLATFORM_SUPPORT: {
    label: 'Support Rep',
    color: 'bg-sky-950 text-sky-300 border-sky-800',
    desc: 'Customer support access to review merchant accounts, shop branches, and verify offline slips.',
  },
  PLATFORM_VIEWER: {
    label: 'Viewer (Read-Only)',
    color: 'bg-amber-950 text-amber-300 border-amber-800',
    desc: 'View-only inspection authority. Can view all dashboards, merchants, and invoices with zero write/modify permissions.',
  },
};

export default function AdminsManagementPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAdminAuthStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add Admin Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'PLATFORM_VIEWER',
  });

  // Edit Admin Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: 'PLATFORM_VIEWER',
    isActive: true,
    resetPassword: '',
  });

  const isViewer = currentUser?.role === 'PLATFORM_VIEWER';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApiClient<AdminUser[]>('/platform/users');
      setUsers(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch platform users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesQuery = !q || fullName.includes(q) || email.includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // ==========================================
  // ADD ADMIN
  // ==========================================
  const handleOpenAddModal = () => {
    if (!isSuperAdmin) {
      alert('Only Super Admins have permission to create platform staff accounts.');
      return;
    }
    setAddForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'PLATFORM_VIEWER',
    });
    setShowPassword(false);
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    if (!addForm.firstName.trim() || !addForm.lastName.trim() || !addForm.email.trim()) {
      alert('All name and email fields are required.');
      return;
    }
    if (!addForm.password || addForm.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    setActionLoading('add-admin');
    setErrorMessage(null);
    try {
      await adminApiClient('/platform/users', {
        method: 'POST',
        body: {
          firstName: addForm.firstName.trim(),
          lastName: addForm.lastName.trim(),
          email: addForm.email.trim().toLowerCase(),
          password: addForm.password,
          role: addForm.role,
        },
      });

      setIsAddModalOpen(false);
      setSuccessMessage(`Platform account for "${addForm.firstName} ${addForm.lastName}" created successfully!`);
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create platform user');
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // EDIT ADMIN
  // ==========================================
  const handleOpenEditModal = (u: AdminUser) => {
    if (!isSuperAdmin) {
      alert('Only Super Admins have permission to modify platform staff accounts.');
      return;
    }
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      role: u.role || 'PLATFORM_VIEWER',
      isActive: u.isActive,
      resetPassword: '',
    });
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isSuperAdmin) return;

    setActionLoading('edit-admin');
    setErrorMessage(null);
    try {
      const payload: any = {
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        role: editForm.role,
        isActive: editForm.isActive,
      };

      if (editForm.resetPassword.trim()) {
        if (editForm.resetPassword.trim().length < 8) {
          alert('New password must be at least 8 characters long.');
          setActionLoading(null);
          return;
        }
        payload.password = editForm.resetPassword.trim();
      }

      await adminApiClient(`/platform/users/${editingUser.id}`, {
        method: 'PUT',
        body: payload,
      });

      setIsEditModalOpen(false);
      setSuccessMessage(`Platform user "${editForm.firstName} ${editForm.lastName}" updated successfully!`);
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update platform user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!isSuperAdmin) {
      alert('Only Super Admins have permission to delete platform staff accounts.');
      return;
    }

    if (u.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete platform account "${u.email}"?`)) {
      return;
    }

    setActionLoading(`delete-${u.id}`);
    try {
      await adminApiClient(`/platform/users/${u.id}`, { method: 'DELETE' });
      setSuccessMessage(`Platform user "${u.email}" deleted successfully.`);
      await fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete platform user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Alert Messages */}
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

      {/* Read-Only View Mode Banner for Viewers */}
      {isViewer && (
        <div className="bg-amber-950 border border-amber-800 rounded-2xl p-4 flex items-center space-x-3 text-xs text-amber-200 animate-in fade-in">
          <div className="w-9 h-9 rounded-xl bg-amber-900 border border-amber-700 text-amber-300 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Platform View-Only Mode Active</span>
            <p className="text-[11px] text-amber-200 mt-0.5">
              You are signed in as a <strong>Platform Viewer</strong>. You have read-only authority to inspect all platform metrics, merchants, invoices, and plans. Creation and modification actions are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Admin Users & Roles</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage platform superadmins, support operators, and view-only auditor roles
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition"
            title="Refresh admin users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Admin User</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Templates Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(ROLE_INFO).map(([key, info]) => {
          const count = users.filter((u) => u.role === key).length;
          return (
            <div
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${info.color}`}>
                  {info.label}
                </span>
                <span className="text-lg font-black text-white font-mono">{count}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {info.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admin name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Security Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
            <option value="PLATFORM_SUPPORT">Platform Support</option>
            <option value="PLATFORM_VIEWER">Platform Viewer (Read-Only)</option>
          </select>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Admin Member</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role & Authority</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading platform admin accounts...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-400">No admin accounts found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_INFO[u.role] || {
                    label: u.role,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                    desc: '',
                  };
                  const initials = `${(u.firstName || '').charAt(0)}${(u.lastName || '').charAt(0)}`.toUpperCase() || 'A';
                  const isViewerAccount = u.role === 'PLATFORM_VIEWER';

                  return (
                    <tr key={u.id} className="hover:bg-slate-850 transition">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                            isViewerAccount
                              ? 'bg-amber-950 border-amber-800 text-amber-300'
                              : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{u.firstName} {u.lastName}</span>
                              {u.id === currentUser?.id && (
                                <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.2 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {u.email}
                      </td>

                      {/* Role Pill */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${roleConfig.color}`}>
                          {isViewerAccount && <Eye className="w-3 h-3 text-amber-400" />}
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.isActive
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                              title="Edit admin account"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={actionLoading === `delete-${u.id}`}
                                className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition"
                                title="Delete admin account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
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

      {/* ======================================================== */}
      {/* MODAL 1: ADD PLATFORM USER                               */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Platform Admin Account</h3>
                  <p className="text-xs text-slate-400">
                    Provision superadmin, support, or read-only viewer accounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ruwan"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fernando"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address (Login) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin.viewer@retailpos.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters..."
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Security Role & Permission Level <span className="text-rose-400">*</span>
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PLATFORM_VIEWER">PLATFORM_VIEWER (Only View Permission — Read-Only Auditor)</option>
                  <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT (Customer Support & Slip Verification)</option>
                  <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Full Administrative Management)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Master Platform Authority)</option>
                </select>
              </div>

              {/* View-Only Explanation Box */}
              {addForm.role === 'PLATFORM_VIEWER' && (
                <div className="bg-amber-950 border border-amber-800 p-3 rounded-xl text-xs text-amber-200 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View-Only Role Enforcement:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This account will have <strong>read-only access</strong>. They can view the platform dashboard, inspect merchant accounts, view subscription plans, and review invoices. All creation, editing, suspension, and deletion APIs are blocked.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'add-admin'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {actionLoading === 'add-admin' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{actionLoading === 'add-admin' ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT PLATFORM USER                              */}
      {/* ======================================================== */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Admin Account</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PLATFORM_VIEWER">PLATFORM_VIEWER (Only View Permission — Read-Only Auditor)</option>
                  <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT (Customer Support & Slip Verification)</option>
                  <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Full Administrative Management)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Master Platform Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to keep existing password..."
                  value={editForm.resetPassword}
                  onChange={(e) => setEditForm({ ...editForm, resetPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    disabled={editingUser.id === currentUser?.id}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Active Account (Permits platform administration login)</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'edit-admin'}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {actionLoading === 'edit-admin' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{actionLoading === 'edit-admin' ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
