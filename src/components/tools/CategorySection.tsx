import React from 'react';
import { ToolCategory } from '../../types';
import { PDFTool } from '../../types';
import { ToolGrid } from './ToolGrid';

interface CategorySectionProps {
  category: ToolCategory;
  title: string;
  description?: string;
  tools: PDFTool[];
  id?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  description,
  tools,
  id,
}) => {
  if (tools.length === 0) return null;

  return (
    <section id={id || `category-${title.toLowerCase().replace(/\s+/g, '-')}`} className="py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-5 gap-2 border-b border-neutral-200/70 dark:border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
            </span>
          </div>
          {description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <ToolGrid tools={tools} columns={3} />
    </section>
  );
};
