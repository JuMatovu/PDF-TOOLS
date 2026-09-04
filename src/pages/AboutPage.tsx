import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { Shield, Zap, Lock, Heart, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PrivacyNotice } from '../components/common/PrivacyNotice';

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div id="about-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          About PDFTOOL
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
          Document processing should be free, fast, and private.
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
          We built PDFTOOL because managing digital contracts, PDFs, and presentations shouldn't require mandatory account registration, paywalls, or compromising personal data.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Zero Friction</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            No signup forms, passwords, or credit card requirements. Just open a tool, drop your files, and obtain your converted document immediately.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Strict Privacy</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We prioritize client-side execution. Any server transfers utilize encrypted HTTPS channels and are permanently purged within 60 minutes.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">27+ Unified Tools</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            From essential compression and merging to AI summarization and digital signatures, our suite covers all modern workplace document needs.
          </p>
        </div>
      </div>

      {/* Security Statement */}
      <PrivacyNotice />

      {/* CTA Box */}
      <div className="p-8 sm:p-10 rounded-3xl bg-emerald-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div>
          <h3 className="text-2xl font-bold">Ready to process your files?</h3>
          <p className="text-emerald-100 text-sm mt-1">
            Explore our catalog of 27 tools or launch our web PDF editor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="px-6 py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-emerald-900 font-bold text-sm shadow-sm cursor-pointer whitespace-nowrap"
        >
          Explore All Tools →
        </button>
      </div>
    </div>
  );
};
