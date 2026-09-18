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
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg ${className}`}>
      <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <SolarIcon name={icon} size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-orange-500/20"
        >
          <SolarIcon name="Plus" size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
