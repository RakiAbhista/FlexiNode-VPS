import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-72 bg-slate-200 rounded-2xl"></div>
    </div>
  );
}
