'use client';

import React from 'react';

// Core Shimmer Box
export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`} />
  );
}

// Service Booking Page Skeleton Loader
export function ServiceBookingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 animate-pulse space-y-6">
      {/* Header Banner Skeleton */}
      <div className="bg-white pt-8 pb-6 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center min-h-[120px]">
          <div className="space-y-3 w-[60%]">
            <SkeletonBox className="h-4 w-24 bg-blue-100" />
            <SkeletonBox className="h-9 w-56 md:w-80" />
            <SkeletonBox className="h-3 w-40" />
          </div>
          <SkeletonBox className="w-24 h-24 rounded-3xl" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-6">
        {/* Category Pills Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 p-3 flex flex-col justify-between">
              <SkeletonBox className="w-7 h-7 rounded-xl" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Problem Input Skeleton */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-28 w-full rounded-2xl" />
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <SkeletonBox className="h-12 rounded-2xl" />
            <SkeletonBox className="h-12 rounded-2xl" />
          </div>

          <SkeletonBox className="h-12 w-full rounded-full bg-blue-200/60" />
        </div>
      </div>
    </div>
  );
}

// User Dashboard Skeleton Loader
export function UserDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 animate-pulse px-4 space-y-6">
      {/* User Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBox className="w-14 h-14 rounded-full" />
          <div className="space-y-2">
            <SkeletonBox className="h-6 w-40" />
            <SkeletonBox className="h-3 w-28" />
          </div>
        </div>
        <SkeletonBox className="w-10 h-10 rounded-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-3">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-8 w-24" />
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-3">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-8 w-24" />
        </div>
      </div>

      {/* Orders Feed */}
      <div className="space-y-3">
        <SkeletonBox className="h-4 w-36" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="h-5 w-20 rounded-full" />
            </div>
            <SkeletonBox className="h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Worker Dashboard Skeleton Loader
export function WorkerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 animate-pulse px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-48" />
          <SkeletonBox className="h-3 w-32" />
        </div>
        <SkeletonBox className="w-12 h-12 rounded-2xl" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-3">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-7 w-28" />
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-3">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-7 w-28" />
        </div>
      </div>

      <div className="space-y-3">
        <SkeletonBox className="h-4 w-40" />
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
            <SkeletonBox className="h-5 w-40" />
            <SkeletonBox className="h-3 w-full" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic Page Skeleton Fallback
export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 animate-pulse space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <SkeletonBox className="h-8 w-48" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3 h-40" />
        <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3 h-40" />
      </div>
    </div>
  );
}
