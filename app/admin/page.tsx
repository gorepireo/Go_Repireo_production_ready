'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutDashboard,
  UserCheck,
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  Search,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  totalBookings: number;
  pendingWorkers: number;
  activeWorkers: number;
  totalCustomers: number;
}

interface WorkerApplication {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  accountStatus: string;
  approvalStatus: string;
  verificationStatus: string;
  experienceYears: number;
  state: string;
  district: string;
  pincode: string;
  area: string;
  description: string;
  categories: string[];
  ratingAverage: number;
  completedJobs: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Booking {
  id: string;
  serviceName: string;
  problemDescription: string;
  address: string;
  scheduleType: string;
  scheduledAt: string | null;
  status: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  worker: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

interface UserItem {
  id: string;
  phone: string;
  email: string | null;
  displayName: string;
  role: string;
  accountStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
}

type TabType = 'overview' | 'workers' | 'bookings' | 'users';

export default function AdminPage() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingWorkers: 0,
    activeWorkers: 0,
    totalCustomers: 0,
  });
  const [workers, setWorkers] = useState<WorkerApplication[]>([]);
  const [workerFilter, setWorkerFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, workersRes, bookingsRes, usersRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/workers?status=all'),
        fetch('/api/admin/bookings?status=all'),
        fetch('/api/admin/users?role=all'),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        if (data.stats) setStats(data.stats);
      }

      if (workersRes.ok) {
        const data = await workersRes.json();
        if (data.workers) setWorkers(data.workers);
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        if (data.bookings) setBookings(data.bookings);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        if (data.users) setUsers(data.users);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load administrative data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleWorkerAction(workerId: string, action: 'approve' | 'reject') {
    setActionBusyId(workerId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update partner application.');

      setMessage({
        type: 'success',
        text: action === 'approve' ? 'Partner application approved successfully!' : 'Partner application rejected.',
      });

      // Update local state immediately
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === workerId
            ? {
                ...w,
                accountStatus: action === 'approve' ? 'active' : 'suspended',
                approvalStatus: action === 'approve' ? 'approved' : 'rejected',
                verificationStatus: action === 'approve' ? 'verified' : 'rejected',
              }
            : w
        )
      );

      // Recalculate stats
      setStats((prev) => ({
        ...prev,
        pendingWorkers: Math.max(0, prev.pendingWorkers - 1),
        activeWorkers: action === 'approve' ? prev.activeWorkers + 1 : prev.activeWorkers,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Action failed.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleBookingStatusChange(bookingId: string, newStatus: string) {
    setActionBusyId(bookingId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking status.');

      setMessage({ type: 'success', text: `Booking status updated to ${newStatus}.` });

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Status update failed.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setActionBusyId(null);
    }
  }

  const filteredWorkers = workers.filter((w) => {
    if (workerFilter === 'pending') return w.accountStatus === 'pending' || w.approvalStatus === 'pending';
    if (workerFilter === 'approved') return w.accountStatus === 'active' && w.approvalStatus === 'approved';
    if (workerFilter === 'rejected') return w.approvalStatus === 'rejected' || w.accountStatus === 'suspended';
    return true;
  });

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch =
      !userSearch ||
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#F4F7FC] text-[#081832]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Go_Repireo" width={38} height={38} className="size-9 object-contain" priority />
              <span className="text-base font-black tracking-tight"><span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span></span>
            </Link>
            <span className="hidden h-5 w-[1px] bg-slate-200 sm:block" />
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0874ef]">
              Admin Operations
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-slate-900">{profile?.display_name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500">{profile?.phone || 'Master Admin'}</p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#0874ef]' : ''} />
            </button>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-[#081832] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={15} />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'workers'
                  ? 'bg-[#081832] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <UserCheck size={15} />
              Partner Approvals
              {stats.pendingWorkers > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white">
                  {stats.pendingWorkers}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'bookings'
                  ? 'bg-[#081832] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CalendarCheck size={15} />
              Bookings
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {stats.totalBookings}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'users'
                  ? 'bg-[#081832] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              User Directory
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Flash Notifications */}
        {message && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-xs font-bold shadow-sm ${
              message.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div
                onClick={() => { setActiveTab('workers'); setWorkerFilter('pending'); }}
                className="cursor-pointer rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Pending Partners</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <UserCheck size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-amber-950 sm:text-3xl">{stats.pendingWorkers}</p>
                <p className="mt-1 text-[11px] font-semibold text-amber-700">Awaiting your approval →</p>
              </div>

              <div
                onClick={() => { setActiveTab('workers'); setWorkerFilter('approved'); }}
                className="cursor-pointer rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Active Partners</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Wrench size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-emerald-950 sm:text-3xl">{stats.activeWorkers}</p>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700">Verified & available</p>
              </div>

              <div
                onClick={() => setActiveTab('bookings')}
                className="cursor-pointer rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">Total Bookings</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <CalendarCheck size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-blue-950 sm:text-3xl">{stats.totalBookings}</p>
                <p className="mt-1 text-[11px] font-semibold text-blue-700">Customer requests</p>
              </div>

              <div
                onClick={() => setActiveTab('users')}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Customers</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Users size={18} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{stats.totalCustomers}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">Registered users</p>
              </div>
            </div>

            {/* Quick Action Queue: Pending Worker Applications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Partner Applications Requiring Action</h2>
                  <p className="text-xs text-slate-500">Service professionals who recently registered and need verification</p>
                </div>
                <button
                  onClick={() => { setActiveTab('workers'); setWorkerFilter('pending'); }}
                  className="text-xs font-bold text-[#0874ef] hover:underline"
                >
                  View all ({stats.pendingWorkers}) →
                </button>
              </div>

              {workers.filter((w) => w.accountStatus === 'pending' || w.approvalStatus === 'pending').length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="mt-2 text-sm font-bold text-slate-800">All caught up!</p>
                  <p className="text-xs text-slate-500">No partner applications are pending review right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workers
                    .filter((w) => w.accountStatus === 'pending' || w.approvalStatus === 'pending')
                    .slice(0, 3)
                    .map((worker) => (
                      <div
                        key={worker.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{worker.name}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Pending Review
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1"><Phone size={12} /> +91 {worker.phone}</span>
                            <span className="flex items-center gap-1"><Briefcase size={12} /> {worker.experienceYears} yrs exp</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {worker.district || worker.state || 'India'}</span>
                          </div>
                          {worker.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {worker.categories.map((c) => (
                                <span key={c} className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0874ef]">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:self-center">
                          <button
                            onClick={() => handleWorkerAction(worker.id, 'approve')}
                            disabled={actionBusyId === worker.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleWorkerAction(worker.id, 'reject')}
                            disabled={actionBusyId === worker.id}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Bookings Queue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Recent Service Bookings</h2>
                  <p className="text-xs text-slate-500">Latest customer orders</p>
                </div>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-bold text-[#0874ef] hover:underline"
                >
                  View all ({bookings.length}) →
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                  No bookings found in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="pb-3 font-bold uppercase tracking-wider">Service</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Customer</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Amount</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                        <th className="pb-3 font-bold uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-900">{booking.serviceName}</td>
                          <td className="py-3 text-slate-600">
                            <div>{booking.customer.name}</div>
                            <div className="text-[10px] text-slate-400">{booking.customer.phone}</div>
                          </td>
                          <td className="py-3 font-bold text-slate-900">₹{booking.amount}</td>
                          <td className="py-3">
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0874ef]">
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER APPLICATIONS / WORKERS */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={() => setWorkerFilter('pending')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    workerFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pending ({workers.filter((w) => w.accountStatus === 'pending' || w.approvalStatus === 'pending').length})
                </button>
                <button
                  onClick={() => setWorkerFilter('approved')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    workerFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Approved ({workers.filter((w) => w.accountStatus === 'active' && w.approvalStatus === 'approved').length})
                </button>
                <button
                  onClick={() => setWorkerFilter('rejected')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    workerFilter === 'rejected'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Rejected ({workers.filter((w) => w.approvalStatus === 'rejected' || w.accountStatus === 'suspended').length})
                </button>
                <button
                  onClick={() => setWorkerFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    workerFilter === 'all'
                      ? 'bg-[#081832] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({workers.length})
                </button>
              </div>

              <span className="text-xs text-slate-500">
                Showing {filteredWorkers.length} service partner{filteredWorkers.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredWorkers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <UserCheck size={36} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">No partner applications found in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkers.map((worker) => {
                  const isPending = worker.accountStatus === 'pending' || worker.approvalStatus === 'pending';
                  const isApproved = worker.accountStatus === 'active' && worker.approvalStatus === 'approved';
                  return (
                    <div
                      key={worker.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Profile Info */}
                        <div className="space-y-2 lg:max-w-[70%]">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{worker.name}</h3>
                            {isPending && (
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                Pending Approval
                              </span>
                            )}
                            {isApproved && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                Approved & Active
                              </span>
                            )}
                            {!isPending && !isApproved && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                                Rejected / Suspended
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div className="flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              <span className="font-medium">+91 {worker.phone}</span>
                            </div>
                            {worker.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail size={13} className="text-slate-400" />
                                <span>{worker.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Briefcase size={13} className="text-slate-400" />
                              <span>{worker.experienceYears} Years Professional Experience</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-400" />
                              <span>
                                {[worker.area, worker.district, worker.state, worker.pincode].filter(Boolean).join(', ') || 'Address not provided'}
                              </span>
                            </div>
                          </div>

                          {/* Services */}
                          {worker.categories.length > 0 && (
                            <div className="pt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Services Offered:</p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {worker.categories.map((cat) => (
                                  <span
                                    key={cat}
                                    className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0874ef]"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {worker.description && (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Application Bio:</p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                {worker.description}
                              </p>
                            </div>
                          )}

                          <p className="text-[10px] text-slate-400">
                            Registered on: {worker.createdAt ? new Date(worker.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row lg:flex-col gap-2 pt-2 lg:pt-0">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleWorkerAction(worker.id, 'approve')}
                                disabled={actionBusyId === worker.id}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 size={15} />
                                Approve Application
                              </button>
                              <button
                                onClick={() => handleWorkerAction(worker.id, 'reject')}
                                disabled={actionBusyId === worker.id}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle size={15} />
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleWorkerAction(worker.id, 'reject')}
                              disabled={actionBusyId === worker.id}
                              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Suspend Partner
                            </button>
                          )}

                          {!isPending && !isApproved && (
                            <button
                              onClick={() => handleWorkerAction(worker.id, 'approve')}
                              disabled={actionBusyId === worker.id}
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Re-activate Partner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {['all', 'requested', 'assigned', 'inService', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setBookingFilter(status)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      bookingFilter === status
                        ? 'bg-[#081832] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                Total: {filteredBookings.length} bookings
              </span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <CalendarCheck size={36} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">No bookings match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black text-slate-900">{b.serviceName}</h4>
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0874ef] uppercase">
                            {b.status}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {b.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'} ({b.paymentMethod})
                          </span>
                        </div>

                        {b.problemDescription && (
                          <p className="text-xs text-slate-600">{b.problemDescription}</p>
                        )}

                        <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2 pt-1">
                          <div>
                            <span className="font-bold text-slate-700">Customer: </span>
                            {b.customer.name} ({b.customer.phone})
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Assigned Partner: </span>
                            {b.worker ? `${b.worker.name} (${b.worker.phone})` : 'Unassigned'}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="font-bold text-slate-700">Address: </span>
                            {b.address || 'Address not recorded'}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400">
                          Booked: {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end justify-between gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900">₹{b.amount}</span>
                        </div>

                        {/* Status selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400">Status:</span>
                          <select
                            value={b.status}
                            disabled={actionBusyId === b.id}
                            onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#0874ef]"
                          >
                            <option value="requested">Requested</option>
                            <option value="assigned">Assigned</option>
                            <option value="inService">In Service</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0874ef] focus:bg-white"
                />
              </div>

              {/* Role filter */}
              <div className="flex gap-1.5">
                {['all', 'customer', 'worker', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                      userRoleFilter === role
                        ? 'bg-[#081832] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900">{u.displayName || 'No Name'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{u.phone}</div>
                            {u.email && <div className="text-[10px] text-slate-400">{u.email}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : u.role === 'worker'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                u.accountStatus === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.accountStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
