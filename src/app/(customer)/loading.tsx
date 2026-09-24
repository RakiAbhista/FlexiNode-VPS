import React from "react";

export default function CustomerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-32 bg-slate-200 rounded-2xl"></div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>
  );
}
