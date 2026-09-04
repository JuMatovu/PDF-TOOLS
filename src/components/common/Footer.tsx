import React from 'react';
import { useRouter } from '../../hooks/useRouter';
import { FileText, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { TOOL_CATEGORIES, getToolsByCategory } from '../../data/tools';
import { SITE_CONFIG } from '../../data/features';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer
      id="pdftool-footer"
      className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200/80 dark:border-neutral-800 transition-colors pt-16 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-200/70 dark:border-neutral-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
                PDF<span className="text-emerald-600 dark:text-emerald-400">TOOL</span>
              </span>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">
              {SITE_CONFIG.description}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>All documents processed securely & deleted within 1 hour.</span>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-3 h-3 text-amber-500" /> 27+ Free Tools • No Sign Up
              </span>
            </div>
          </div>

          {/* Quick Categories Column 1 */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Organize & Optimize
            </div>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/merge-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/split-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/compress-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/organize-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Organize PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/scan-to-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Scan to PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Convert Column 2 */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Convert Files
            </div>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/pdf-to-word')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  PDF to Word
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/word-to-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Word to PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/jpg-to-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  JPG to PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/pdf-to-jpg')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  PDF to JPG
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/powerpoint-to-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  PowerPoint to PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Edit, Security & Company */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              PDFTOOL Suite
            </div>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/edit-pdf')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Interactive PDF Editor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/sign-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Sign PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/tools/protect-pdf')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/help')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Help & FAQs
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div>
            © {new Date().getFullYear()} PDFTOOL. All rights reserved. Free document productivity suite.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="hover:text-neutral-800 dark:hover:text-white"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="hover:text-neutral-800 dark:hover:text-white"
            >
              Security Guarantee
            </button>
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="hover:text-neutral-800 dark:hover:text-white font-medium text-emerald-600 dark:text-emerald-400"
            >
              All Tools Directory
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
