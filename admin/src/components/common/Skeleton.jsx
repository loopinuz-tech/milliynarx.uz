import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/70 dark:bg-slate-800 rounded-lg ${className}`} />
);

export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b border-slate-100 dark:border-slate-800 animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-3.5 px-4">
        <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse flex flex-col gap-3">
    <div className="w-full h-40 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded w-16" />
    </div>
  </div>
);

export const MetricSkeleton = () => (
  <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse">
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-3" />
    <div className="h-7 bg-slate-300 dark:bg-slate-700 rounded w-2/3 mb-2" />
    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
  </div>
);

export default Skeleton;
