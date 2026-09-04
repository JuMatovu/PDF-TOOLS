import React, { useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import { HelpCircle, ChevronDown, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { SITE_CONFIG } from '../data/features';
import { PrivacyNotice } from '../components/common/PrivacyNotice';

const FAQS = [
  {
    q: 'Is PDFTOOL really 100% free to use?',
    a: 'Yes! All 27 tools and the interactive PDF editor are completely free. There are no hidden subscription paywalls, no watermarks placed on your documents, and no credit card required.',
  },
  {
    q: 'Do I need to register or create an account?',
    a: 'No. PDFTOOL is built from the ground up as a no-account-required utility. You can immediately access any tool and process your documents.',
  },
  {
    q: 'How long are my files kept on servers?',
    a: `We take privacy seriously. Your files are automatically purged from our servers within ${SITE_CONFIG.retentionHours} hour of processing. We do not inspect, retain, sell, or train AI models on your files.`,
  },
  {
    q: 'What is the maximum file size supported?',
    a: 'Most tools support documents up to 100MB per file. For lightweight documents and images, batch processing allows uploading multiple files simultaneously.',
  },
  {
    q: 'Can I edit and add signatures to my PDF?',
    a: 'Yes! You can use our dedicated "/edit-pdf" interactive editor shell or the specialized "Sign PDF" tool to add text boxes, draw signatures, insert logos, and annotate pages.',
  },
  {
    q: 'Does PDFTOOL work on smartphones and tablets?',
    a: 'Yes, PDFTOOL is fully responsive and operates smoothly on iOS Safari, Android Chrome, and modern tablet browsers without installing native apps.',
  },
];

export const HelpPage: React.FC = () => {
  const { navigate } = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div id="help-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          Help & Support
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
          Everything you need to know about processing documents safely and efficiently on PDFTOOL.
        </p>
      </div>

      {/* Accordion FAQ items */}
      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-neutral-900 dark:text-white cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform duration-150 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <PrivacyNotice />

      {/* Quick Navigation Footer */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm cursor-pointer"
        >
          <span>Explore All 27 Tools</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
