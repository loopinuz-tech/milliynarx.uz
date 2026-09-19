import React from 'react';

export const Badge = ({ status, text, size = 'sm' }) => {
  const normalized = (status || text || '').toUpperCase();
  
  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let label = text || status;

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'CONNECTED':
    case 'IN_STOCK':
      styles = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      label = label || (normalized === 'IN_STOCK' ? 'Mavjud' : 'Faol');
      break;
      
    case 'PENDING':
    case 'PENDING_APPROVAL':
      styles = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      label = label || 'Tasdiqlash kutilmoqda';
      break;
      
    case 'REJECTED':
    case 'OUT_OF_STOCK':
    case 'ERROR':
    case 'DISCONNECTED':
      styles = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      label = label || (normalized === 'OUT_OF_STOCK' ? 'Tugagan' : 'Rad etilgan');
      break;

    case 'NOT_CONFIGURED':
      styles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      label = 'Ulanmagan';
      break;

    case 'SUSPENDED':
    case 'ARCHIVED':
    case 'DRAFT':
      styles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      label = label || 'Qoralama';
      break;

    case 'NEW':
      styles = 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/60';
      label = 'Yangi';
      break;

    default:
      styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[11px]' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium border rounded-full tracking-tight ${sizeClasses} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {label}
    </span>
  );
};

export default Badge;
