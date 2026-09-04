import React, { useState, useMemo } from 'react';
import { TOOL_CATEGORIES, TOOLS, getToolsByCategory } from '../data/tools';
import { CategorySection } from '../components/tools/CategorySection';
import { ToolGrid } from '../components/tools/ToolGrid';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { Search, X, Sparkles, Filter } from 'lucide-react';
import { ToolCategory } from '../types';

export const AllToolsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.acceptedFormats.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div id="all-tools-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>All 27 Productivity Utilities</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          Every PDF & Document Tool You Need
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg">
          Fast, free, and secure. Select any tool below to begin processing documents without signing up.
        </p>

        {/* Live Search Input */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search tools by name or keyword (e.g. compress, word, sign)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            All (27)
          </button>
          {TOOL_CATEGORIES.map((cat) => {
            const count = getToolsByCategory(cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {searchQuery || selectedCategory !== 'ALL' ? (
        /* Filtered Flat Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-neutral-500 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <span>
              Found <strong className="text-neutral-900 dark:text-white">{filteredTools.length}</strong> matching tools
            </span>
            {(searchQuery || selectedCategory !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
                className="text-emerald-600 hover:underline text-xs font-medium cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredTools.length > 0 ? (
            <ToolGrid tools={filteredTools} columns={3} />
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              <p className="text-neutral-500 dark:text-neutral-400 text-base">
                No tools found matching "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Categorized Sections */
        <div className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-800">
          {TOOL_CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat.id}
              title={cat.label}
              description={cat.description}
              tools={getToolsByCategory(cat.id)}
            />
          ))}
        </div>
      )}

      {/* Bottom Privacy Assurance */}
      <div className="pt-6">
        <PrivacyNotice />
      </div>
    </div>
  );
};
