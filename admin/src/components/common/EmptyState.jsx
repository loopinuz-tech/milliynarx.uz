import React from 'react';
import SolarIcon from './SolarIcon';

export const EmptyState = ({
  icon = 'Database',
  title = "Ma'lumot mavjud emas",
  description = "Hozircha ushbu bo'limda hech qanday ma'lumot ro'yxatga olinmagan.",
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#111827] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <SolarIcon name={icon} size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-orange-500/20"
        >
          <SolarIcon name="Plus" size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
