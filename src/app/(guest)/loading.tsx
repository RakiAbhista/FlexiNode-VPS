import React from "react";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-pulse">
      {/* Hero Skeleton */}
      <div className="text-center space-y-4 max-w-3xl mx-auto py-16">
        <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto"></div>
        <div className="h-10 bg-slate-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
        <div className="flex justify-center gap-4 pt-4">
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Features Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border border-slate-100 rounded-xl space-y-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
