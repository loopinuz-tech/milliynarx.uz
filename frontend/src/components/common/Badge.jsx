import React from 'react';

export const Badge = ({ status, text, size = 'sm' }) => {
  const normalized = (status || text || '').toUpperCase();
  
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = text || status;

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'CONNECTED':
    case 'IN_STOCK':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = label || (normalized === 'IN_STOCK' ? 'Mavjud' : 'Faol');
      break;
      
    case 'PENDING':
    case 'PENDING_APPROVAL':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = label || 'Tasdiqlash kutilmoqda';
      break;
      
    case 'REJECTED':
    case 'OUT_OF_STOCK':
    case 'ERROR':
    case 'DISCONNECTED':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      label = label || (normalized === 'OUT_OF_STOCK' ? 'Tugagan' : 'Rad etilgan');
      break;

    case 'NOT_CONFIGURED':
      styles = 'bg-slate-100 text-slate-600 border-slate-300';
      label = 'Ulanmagan';
      break;

    case 'SUSPENDED':
    case 'ARCHIVED':
    case 'DRAFT':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      label = label || 'Qoralama';
      break;

    case 'NEW':
      styles = 'bg-orange-50 text-orange-700 border-orange-200';
      label = 'Yangi';
      break;

    default:
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
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
