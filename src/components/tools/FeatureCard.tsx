import React from 'react';
import { FeatureMetric } from '../../types';
import { ToolIcon } from '../../lib/icons';

interface FeatureCardProps {
  metric: FeatureMetric;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ metric }) => {
  return (
    <div
      id={`feature-card-${metric.id}`}
      className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800"
    >
      <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
        <ToolIcon name={metric.iconName} className="w-5 h-5" />
      </div>
      <div>
        <div className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
          {metric.title}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
          {metric.subtitle}
        </div>
      </div>
    </div>
  );
};
