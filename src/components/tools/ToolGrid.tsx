import React from 'react';
import { PDFTool } from '../../types';
import { ToolCard } from './ToolCard';

interface ToolGridProps {
  tools: PDFTool[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
  className?: string;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  columns = 3,
  compact = false,
  className = '',
}) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  }[columns];

  return (
    <div className={`grid gap-4 sm:gap-5 ${colClass} ${className}`}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} compact={compact} />
      ))}
    </div>
  );
};
