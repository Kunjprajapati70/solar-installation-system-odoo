import React from 'react';

export const SkeletonCard = () => (
  <div className="p-4 rounded-xl glass-card border border-slate-800 animate-pulse space-y-3">
    <div className="flex justify-between items-center">
      <div className="h-3 w-20 bg-slate-800 rounded" />
      <div className="h-5 w-5 bg-slate-800 rounded-full" />
    </div>
    <div className="h-7 w-28 bg-slate-700/80 rounded" />
    <div className="h-2.5 w-36 bg-slate-800/60 rounded" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="w-full glass-card border border-slate-800 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-800 flex justify-between">
      <div className="h-4 w-32 bg-slate-800 rounded" />
      <div className="h-7 w-24 bg-slate-800 rounded" />
    </div>
    <div className="divide-y divide-slate-800/60">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between space-x-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-3.5 bg-slate-800/80 rounded"
              style={{ width: `${Math.max(12, Math.floor(80 / cols))}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="p-5 rounded-2xl glass-card border border-slate-800 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <div className="h-4 w-40 bg-slate-800 rounded" />
        <div className="h-2.5 w-60 bg-slate-800/60 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-800 rounded" />
    </div>
    <div className="h-64 w-full bg-slate-800/40 rounded-xl flex items-end p-4 space-x-3">
      {Array.from({ length: 12 }).map((_, idx) => (
        <div
          key={idx}
          className="flex-1 bg-slate-800 rounded-t"
          style={{ height: `${20 + ((idx * 17) % 70)}%` }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  if (type === 'table') return <SkeletonTable />;
  if (type === 'chart') return <SkeletonChart />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
