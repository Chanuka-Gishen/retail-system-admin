'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Eye,
  LogOut,
  FileCheck,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Tag,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAdminAuthStore } from '../lib/auth-store';

export function AdminNavbar({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAdminAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedCollapsed = localStorage.getItem('platform_admin_sidebar_collapsed');
      if (savedCollapsed === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const isLoginPage = pathname === '/login';
  const isAuthed = mounted && isAuthenticated && !isLoginPage;

  // Toggle Collapse and persist in localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('platform_admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const handleLogout = () => {
    setIsMobileOpen(false);
    logout();
    router.push('/login');
  };

  const isViewer = user?.role === 'PLATFORM_VIEWER';
  const roleDisplay = user?.role ? user.role.replace('PLATFORM_', '') : 'SUPERADMIN';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950 border-emerald-500 text-white font-bold',
      activeText: 'text-emerald-400',
      description: 'Platform KPIs & system status',
    },
    {
      name: 'Merchants',
      href: '/merchants',
      icon: Building2,
      color: 'text-teal-400',
      activeBg: 'bg-teal-950 border-teal-500 text-white font-bold',
      activeText: 'text-teal-400',
      description: 'Tenants, stores & subscriptions',
    },
    {
      name: 'Subscription Plans',
      href: '/plans',
      icon: CreditCard,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950 border-emerald-500 text-white font-bold',
      activeText: 'text-emerald-400',
      description: 'Tiers, pricing & quota policies',
    },
    {
      name: 'Promo Codes',
      href: '/promos',
      icon: Tag,
      color: 'text-amber-400',
      activeBg: 'bg-amber-950 border-amber-500 text-white font-bold',
      activeText: 'text-amber-400',
      description: 'Promos, campaigns & tracking',
    },
    {
      name: 'Payment Slips',
      href: '/verifications',
      icon: FileCheck,
      color: 'text-teal-400',
      activeBg: 'bg-teal-950 border-teal-500 text-white font-bold',
      activeText: 'text-teal-400',
      description: 'Bank deposit verification queue',
    },
    {
      name: 'Admin Users',
      href: '/admins',
      icon: Users,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-950 border-cyan-500 text-white font-bold',
      activeText: 'text-cyan-400',
      description: 'Platform staff & role permissions',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* ========================================================================= */}
      {/* DESKTOP PERMANENT COLLAPSIBLE SIDEBAR (md:flex)                           */}
      {/* ========================================================================= */}
      {isAuthed && (
        <aside
          className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 z-30 select-none transition-all duration-300 ease-in-out ${
            isCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72'
          }`}
        >
          {/* Sidebar Top Brand Header */}
          <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            {!isCollapsed ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2.5 group transition min-w-0"
                  title="Platform Admin OS"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition shadow-sm shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-white tracking-tight leading-none group-hover:text-emerald-400 transition truncate">
                      Platform Admin OS
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider mt-1 truncate">
                      SuperAdmin Portal
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0 ml-1"
                  title="Collapse sidebar to icon rail"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-center text-emerald-400 transition group"
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition" />
                </button>
              </div>
            )}
          </div>

          {/* Admin User Profile Card */}
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            {!isCollapsed ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Platform Administrator'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@retailpos.com'}</div>
                  <div className="mt-1">
                    {isViewer ? (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center w-fit space-x-1">
                        <Eye className="w-2.5 h-2.5 text-amber-400" />
                        <span>VIEWER (READ-ONLY)</span>
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">
                        {roleDisplay}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 cursor-default relative"
                  title={`${user?.firstName ? `${user.firstName} ${user.lastName}` : 'Admin'} • ${roleDisplay}`}
                >
                  <User className="w-4 h-4" />
                  {isViewer ? (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-900" />
                  ) : (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Management Modules
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={`${item.name} — ${item.description}`}
                    className={`flex items-center justify-center w-full h-11 rounded-xl border transition group relative ${
                      isActive
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950/40 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r" />
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition group ${
                    isActive
                      ? `${item.activeBg} shadow-sm`
                      : 'bg-slate-950/40 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                        isActive
                          ? 'bg-slate-900 border-slate-700 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isActive
                        ? `${item.activeText} translate-x-0.5`
                        : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2.5">
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>API Online</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">v1.0 Enterprise</span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
                  title="API Online • v1.0 Enterprise"
                />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-10 h-10 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 rounded-xl flex items-center justify-center transition"
                  title="Log Out of Admin OS"
                  aria-label="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* MOBILE COMPACT TOP HEADER (md:hidden)                                     */}
      {/* ========================================================================= */}
      {isAuthed && (
        <header className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2 font-bold text-sm text-emerald-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="truncate">Platform Admin OS</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {isViewer ? (
              <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                VIEWER
              </span>
            ) : (
              <span className="bg-slate-800 text-emerald-400 border border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                {roleDisplay}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* MOBILE DRAWER SIDEBAR                                                     */}
      {/* ========================================================================= */}
      {isAuthed && (
        <div
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isMobileOpen}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <div
            className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white tracking-tight">Platform Admin OS</div>
                  <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">SuperAdmin Portal</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                aria-label="Close navigation sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Profile */}
            <div className="p-4 border-b border-slate-800 bg-slate-900">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Platform Administrator'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@retailpos.com'}</div>
                  <div className="mt-1">
                    {isViewer ? (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        VIEWER (READ-ONLY)
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-emerald-400 border border-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                        {roleDisplay}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Management Modules
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition group ${
                      isActive
                        ? `${item.activeBg} ring-1 ring-emerald-500`
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                          isActive
                            ? 'bg-slate-900 border-emerald-500/50 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? `${item.activeText} translate-x-0.5`
                          : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Admin OS</span>
              </button>
              <div className="text-center text-[10px] text-slate-500 font-mono">
                Platform Admin OS • v1.0 Enterprise
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTENT AREA                                                */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isAuthed ? (isCollapsed ? 'md:pl-20' : 'md:pl-64 lg:pl-72') : ''
        }`}
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
