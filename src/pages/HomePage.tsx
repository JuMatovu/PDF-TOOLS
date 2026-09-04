import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { POPULAR_TOOLS, TOOL_CATEGORIES, getToolsByCategory } from '../data/tools';
import { FEATURE_METRICS, TRUST_POINTS } from '../data/features';
import { FeatureCard } from '../components/tools/FeatureCard';
import { ToolCard } from '../components/tools/ToolCard';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { ArrowRight, ChevronDown, Sparkles, ShieldCheck, Zap, Laptop, FileText, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section */}
      <section id="hero-section" className="pt-8 sm:pt-14 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Free Web PDF Suite • No Registration Required</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
                All-in-One <br />
                <span className="text-emerald-600 dark:text-emerald-400">PDF & Document</span> Tools
              </h1>

              <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed">
                All the tools you need to work with PDFs and documents: easy, fast, 100% free, and completely secure right in your browser.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {/* Primary CTA (Green) */}
                <button
                  type="button"
                  id="hero-explore-tools-btn"
                  onClick={() => navigate('/tools')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md shadow-emerald-600/25 hover:shadow-lg transition-all duration-150 cursor-pointer active:scale-[0.99]"
                >
                  <span>Explore Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary CTA (Yellow) */}
                <button
                  type="button"
                  id="hero-convert-pdf-btn"
                  onClick={() => navigate('/tools/word-to-pdf')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-base border border-amber-500/40 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.99]"
                >
                  <span>Convert to PDF</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Instant reassurance */}
              <div className="flex items-center gap-6 pt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No email required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Files auto-deleted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> High-speed processing
                </span>
              </div>
            </div>

            {/* Right Abstract Visual Illustration (Handcrafted SVG & Modern UI Composition) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square sm:aspect-[4/3] lg:aspect-square flex items-center justify-center">
                {/* Background ambient decorative glows */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/60 to-amber-100/60 dark:from-emerald-950/20 dark:to-amber-950/20 rounded-3xl blur-2xl -z-10" />

                {/* Main Illustration Device/Document Stage */}
                <div className="relative w-full max-w-sm p-6 rounded-3xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 shadow-xl backdrop-blur-xs">
                  {/* Mock Laptop / Canvas Frame */}
                  <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 p-4 space-y-3">
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">PDFTOOL Engine v2.4</span>
                    </div>

                    {/* Document Mock representation */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-xs border border-neutral-100 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                            PDF
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-900 dark:text-white">contract_signed.pdf</div>
                            <div className="text-[10px] text-neutral-400">1.4 MB • 4 Pages</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          Processed
                        </span>
                      </div>

                      {/* Mock skeleton content lines */}
                      <div className="space-y-1.5 pt-1">
                        <div className="h-2 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                        <div className="h-2 w-5/6 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Badge 1: Security Shield */}
                  <div className="absolute -top-4 -right-3 sm:-right-5 bg-white dark:bg-neutral-800 rounded-2xl p-3 border border-emerald-200 dark:border-emerald-800/80 shadow-lg flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">100% Private</div>
                      <div className="text-[10px] text-neutral-500">Auto-Deleted</div>
                    </div>
                  </div>

                  {/* Floating Badge 2: Yellow Highlight Pill */}
                  <div className="absolute -bottom-3 -left-3 sm:-left-5 bg-amber-400 text-neutral-950 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2 border border-amber-500/30">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold tracking-tight">27+ Instant Tools</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section id="feature-strip" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {FEATURE_METRICS.map((metric) => (
            <FeatureCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      {/* Popular Tools Section */}
      <section id="popular-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Most Used Every Day
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Popular Tools
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer self-start sm:self-auto"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Popular Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {POPULAR_TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact={false} />
          ))}
        </div>
      </section>

      {/* Interactive Editor Feature Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 dark:bg-neutral-900 text-white p-8 sm:p-12 border border-neutral-800 shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                Full-Featured Web Canvas
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                Need to annotate, sign, or edit directly?
              </h3>
              <p className="text-neutral-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Use our rich online PDF editor to add text boxes, draw signatures, insert high-res images, highlight clauses, and place geometric shapes without downloading heavy desktop applications.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/edit-pdf')}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-sm transition-all cursor-pointer shadow-md"
                >
                  Open PDF Editor Shell →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tools/sign-pdf')}
                  className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-all cursor-pointer border border-neutral-700"
                >
                  Electronic Signatures
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-xs p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-700">
                  <span>Toolbar Shortcuts</span>
                  <span className="text-emerald-400 font-mono">Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">✍️ Draw Signature</div>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">🔤 Text Annotate</div>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">🖍️ Color Highlight</div>
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">🖼️ Image Overlay</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PrivacyNotice />
      </section>
    </div>
  );
};
