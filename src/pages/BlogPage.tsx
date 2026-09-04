import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { Sparkles, Clock, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

const ARTICLES = [
  {
    id: '1',
    title: 'How to Compress Large PDFs for Email Without Losing Print Quality',
    excerpt: 'Learn the optimal compression ratios for contracts, flyers, and technical schematics without introducing blurriness.',
    tag: 'Optimization',
    readTime: '4 min read',
    date: 'Sep 2, 2026',
    route: '/tools/compress-pdf',
  },
  {
    id: '2',
    title: 'Converting Word DOCX to PDF: Preserving Exact Margins and Typography',
    excerpt: 'Why standard document export sometimes shifts fonts and how PDFTOOL ensures pixel-perfect fidelity.',
    tag: 'Conversion',
    readTime: '5 min read',
    date: 'Aug 28, 2026',
    route: '/tools/word-to-pdf',
  },
  {
    id: '3',
    title: 'Digital Signatures vs. Electronic Signatures: What You Need to Know',
    excerpt: 'An overview of modern document authorization standards, legally binding agreements, and how to sign documents securely.',
    tag: 'Security',
    readTime: '6 min read',
    date: 'Aug 22, 2026',
    route: '/tools/sign-pdf',
  },
  {
    id: '4',
    title: 'Why Automatic Document Purging Matters for Data Privacy',
    excerpt: 'Understanding why zero-registration document platforms provide superior protection against credential leaks.',
    tag: 'Privacy',
    readTime: '3 min read',
    date: 'Aug 15, 2026',
    route: '/about',
  },
];

export const BlogPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div id="blog-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          PDFTOOL Insights
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
          Document Guides & Security Tips
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base">
          Practical tutorials, format optimization strategies, and best practices for managing documents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ARTICLES.map((article) => (
          <article
            key={article.id}
            onClick={() => navigate(article.route)}
            className="group p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px]">
                  {article.tag}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {article.readTime}
                </span>
              </div>

              <h2 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {article.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Read guide</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
