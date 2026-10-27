'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Search,
  Bell,
  Phone,
  Eye,
  X,
  Snowflake,
  Wrench,
  Sun,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';

interface ScheduledJob {
  id: string;
  serviceName: string;
  problemTitle: string;
  address: string;
  scheduleType: string;
  scheduledAt: string;
  status: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  isAssignedToMe: boolean;
  isAwaitingAcceptance: boolean;
  customer: {
    name: string;
    phone: string;
  };
}

interface Stats {
  upcomingJobs: number;
  todayAppointments: number;
  acceptedJobs: number;
  completedJobs: number;
}

function formatScheduledDate(dateString?: string) {
  if (!dateString) return 'Upcoming Appointment';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year} - ${hourStr}:${minutes} ${ampm}`;
  } catch {
    return dateString;
  }
}

function getApplianceIcon(serviceName: string) {
  const name = serviceName.toLowerCase();
  if (name.includes('ac') || name.includes('air conditioner') || name.includes('cooling')) {
    return (
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#0874ef] shadow-inner">
        <Snowflake size={26} className="text-[#0874ef]" />
      </div>
    );
  }
  if (name.includes('wash') || name.includes('machine') || name.includes('spin')) {
    return (
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 shadow-inner">
        <Sparkles size={26} className="text-indigo-600" />
      </div>
    );
  }
  return (
    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-inner">
      <Wrench size={26} className="text-[#0874ef]" />
    </div>
  );
}

export default function WorkerScheduledJobsPage() {
  const { user, profile, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    upcomingJobs: 0,
    todayAppointments: 0,
    acceptedJobs: 0,
    completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'today'>('upcoming');
  const [search, setSearch] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);

  // Guard: if customer, redirect to user dashboard
  useEffect(() => {
    if (!authLoading && role === 'customer') {
      router.replace('/dashboard/user');
    }
  }, [authLoading, role, router]);

  const loadScheduledJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/worker/scheduled-jobs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.jobs) setJobs(data.jobs);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheduledJobs();
  }, [loadScheduledJobs]);

  async function handleAccept(jobId: string) {
    setAcceptingId(jobId);
    try {
      const res = await fetch('/api/worker/scheduled-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: jobId, action: 'accept' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to accept this job.');

      // Update state locally
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'assigned',
                isAssignedToMe: true,
                isAwaitingAcceptance: false,
              }
            : j
        )
      );
      setStats((prev) => ({
        ...prev,
        acceptedJobs: prev.acceptedJobs + 1,
      }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to accept job.');
    } finally {
      setAcceptingId(null);
    }
  }

  // Filter jobs by tab (upcoming vs today) and search keyword
  const filteredJobs = jobs.filter((j) => {
    const isToday =
      j.scheduledAt &&
      new Date(j.scheduledAt).toDateString() === new Date().toDateString();

    if (tab === 'today' && !isToday) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchService = j.serviceName.toLowerCase().includes(q);
      const matchTitle = j.problemTitle.toLowerCase().includes(q);
      const matchCust = j.customer.name.toLowerCase().includes(q);
      const matchAddr = j.address.toLowerCase().includes(q);
      return matchService || matchTitle || matchCust || matchAddr;
    }
    return true;
  });

  const workerName = (profile?.display_name as string) || user?.displayName || 'Partner';
  const workerLocation = (profile?.district as string) || (profile?.state as string) || 'Etawah, UP';

  return (
    <main className="min-h-screen bg-[#F6F9FD] pb-28 text-[#081832]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard/worker" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Go_Repireo" width={34} height={34} className="size-8 object-contain" priority />
            <span className="text-sm font-black tracking-tight uppercase">
              <span className="text-[#0874ef]">Go_</span><span className="text-[#ff8a00]">Repireo</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/chat')}
              className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* Worker Location Pill */}
        <div className="pt-3">
          <button className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3 py-1 text-xs font-bold text-[#0874ef]">
            <MapPin size={13} className="text-[#0874ef]" />
            <span>{workerLocation}</span>
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Greeting Banner */}
        <section className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              Hi, {workerName} 👋
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Ready for your next service?
            </p>
          </div>
          <div className="relative size-16 shrink-0">
            <Image
              src="/clipboard_3d.png"
              alt="Calendar Icon"
              width={64}
              height={64}
              className="size-full object-contain drop-shadow-md"
              priority
            />
          </div>
        </section>

        {/* Hero Scheduled Jobs Card */}
        <section className="relative mt-4 overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-[#0874ef] via-[#1062c9] to-[#081832] p-5 text-white shadow-[0_14px_30px_rgba(8,116,239,0.18)]">
          <div className="relative z-10 max-w-[240px]">
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
              Scheduled Jobs
            </span>
            <p className="mt-2 text-xs font-medium leading-relaxed text-blue-50">
              Manage your upcoming service appointments and keep your schedule on track.
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-2 -right-2 size-28 drop-shadow-xl opacity-90">
            <Image
              src="/bottom_toolbox_3d.png"
              alt="Toolbox"
              width={112}
              height={112}
              className="size-full object-contain"
            />
          </div>
        </section>

        {/* 4 Counter Metrics (2x2 Grid) */}
        <section className="mt-4 grid grid-cols-2 gap-3">
          {/* Card 1: Upcoming Jobs */}
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-[#0874ef]">
                <Calendar size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Upcoming Jobs</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {stats.upcomingJobs.toString().padStart(2, '0')}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
              • active queue
            </p>
          </div>

          {/* Card 2: Today's Appointments */}
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Sun size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Today&apos;s Appointments</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {stats.todayAppointments.toString().padStart(2, '0')}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
              • for today
            </p>
          </div>

          {/* Card 3: Accepted Jobs */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Accepted Jobs</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {stats.acceptedJobs.toString().padStart(2, '0')}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
              • assigned to you
            </p>
          </div>

          {/* Card 4: Completed Jobs */}
          <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ShieldCheck size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Completed Jobs</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {stats.completedJobs.toString().padStart(2, '0')}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-purple-600">
              • successfully done
            </p>
          </div>
        </section>

        {/* Tab Selector & Filter Button */}
        <section className="mt-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('upcoming')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                tab === 'upcoming'
                  ? 'bg-[#0874ef] text-white shadow-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upcoming <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{stats.upcomingJobs}</span>
            </button>

            <button
              onClick={() => setTab('today')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                tab === 'today'
                  ? 'bg-[#0874ef] text-white shadow-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Today <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">{stats.todayAppointments}</span>
            </button>
          </div>

          <button
            onClick={() => setSearch('')}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            title="Filter"
          >
            <SlidersHorizontal size={16} />
          </button>
        </section>

        {/* Search Input */}
        <section className="mt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-[#0874ef] focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Scheduled Jobs List */}
        <section className="mt-4 space-y-3.5">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-4" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Calendar size={36} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-700">No scheduled appointments</p>
              <p className="mt-1 text-xs text-slate-500">
                {tab === 'today'
                  ? 'You have no service visits booked for today.'
                  : 'New scheduled bookings from customers will appear here automatically.'}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  {/* Appliance Icon Thumbnail */}
                  <div className="shrink-0 pt-0.5">
                    {getApplianceIcon(job.serviceName)}
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0874ef]">
                        {job.serviceName}
                      </span>

                      {job.isAwaitingAcceptance ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50/60 px-2.5 py-0.5 text-[10px] font-bold text-[#0874ef]">
                          Awaiting Acceptance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Problem Title */}
                    <h3 className="mt-1.5 truncate text-sm font-black text-slate-900">
                      {job.problemTitle}
                    </h3>

                    {/* Metadata: Customer, Date/Time, Location */}
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User size={13} className="shrink-0 text-slate-400" />
                        <span className="font-semibold">{job.customer.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Clock size={13} className="shrink-0 text-slate-400" />
                        <span>{formatScheduledDate(job.scheduledAt)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate text-slate-500">
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price and Action Buttons */}
                <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-base font-black text-slate-900">₹{job.amount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.isAwaitingAcceptance && (
                      <button
                        onClick={() => handleAccept(job.id)}
                        disabled={acceptingId === job.id}
                        className="flex items-center gap-1.5 rounded-full bg-[#0874ef] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0764ce] active:scale-95 disabled:opacity-50"
                      >
                        <Check size={14} />
                        {acceptingId === job.id ? 'Accepting…' : 'Accept'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedJob(job)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                    >
                      <Eye size={13} className="text-[#0874ef]" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Details Slide-Over / Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] border border-white bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0874ef]">
                  {selectedJob.serviceName}
                </span>
                <h3 className="mt-1 text-base font-black text-slate-900">{selectedJob.problemTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="font-bold text-slate-500">Scheduled Date & Time:</span>
                <span className="font-black text-slate-900">{formatScheduledDate(selectedJob.scheduledAt)}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="font-bold text-slate-500">Quoted Earnings:</span>
                <span className="text-base font-black text-emerald-600">₹{selectedJob.amount}</span>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Customer</p>
                <p className="mt-1 font-bold text-slate-900">{selectedJob.customer.name}</p>
                {selectedJob.customer.phone && (
                  <a
                    href={`tel:${selectedJob.customer.phone}`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0874ef] hover:bg-blue-100"
                  >
                    <Phone size={13} />
                    Call {selectedJob.customer.phone}
                  </a>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Service Location</p>
                <p className="mt-1 text-slate-700 leading-relaxed">{selectedJob.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[#0874ef] hover:underline font-bold text-[11px]"
                >
                  <Navigation size={12} />
                  Open in Google Maps →
                </a>
              </div>
            </div>

            <div className="pt-2">
              {selectedJob.isAwaitingAcceptance ? (
                <button
                  onClick={() => {
                    handleAccept(selectedJob.id);
                    setSelectedJob(null);
                  }}
                  className="w-full rounded-full bg-[#0874ef] py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#0764ce]"
                >
                  Accept Appointment
                </button>
              ) : (
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-full rounded-full bg-slate-900 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-black"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Worker Bottom Navigation */}
      <BottomNav />
    </main>
  );
}
