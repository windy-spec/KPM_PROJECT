import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendColor }) => {
  return (
    <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-on-surface tracking-tight">
            {value}
          </h3>
        </div>
        <div className="p-2.5 bg-surface-container rounded-xl text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-outline-variant/40">
        <span className="text-[11px] font-bold text-on-surface-variant/60">
          {subtext}
        </span>
        {trend && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trendColor === 'green' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
            }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;