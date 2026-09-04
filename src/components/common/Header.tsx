import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useTheme } from '../../hooks/useTheme';
import { MegaMenu } from './MegaMenu';
import {
  FileText,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS, getToolsByCategory } from '../../data/tools';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export const Header: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');

  const langRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnterAllTools = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeaveAllTools = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 200);
  };

  const filteredMobileTools = mobileSearch.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(mobileSearch.toLowerCase()) ||
          t.category.toLowerCase().includes(mobileSearch.toLowerCase())
      )
    : [];

  return (
    <header
      id="pdftool-header"
      className="sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => {
                setIsMegaMenuOpen(false);
                setMobileMenuOpen(false);
                navigate('/');
              }}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              {/* PDFTOOL Modern Geometric Logo */}
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
                    PDF<span className="text-emerald-600 dark:text-emerald-400">TOOL</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMegaMenuOpen(false);
                navigate('/');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Home
            </button>

            {/* All Tools with MegaMenu Trigger */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnterAllTools}
              onMouseLeave={handleMouseLeaveAllTools}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen((prev) => !prev);
                  if (!isMegaMenuOpen && currentPath !== '/tools') {
                    // allows click to toggle menu or visit
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPath.startsWith('/tools') || isMegaMenuOpen
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <span>All Tools</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isMegaMenuOpen ? 'rotate-180 text-emerald-600' : 'text-neutral-400'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMegaMenuOpen(false);
                navigate('/about');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/about'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              About
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMegaMenuOpen(false);
                navigate('/blog');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/blog'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Blog
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMegaMenuOpen(false);
                navigate('/help');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/help'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Help
            </button>
          </nav>

          {/* Right: Theme toggle & Language selector */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg py-1.5 z-50 text-left">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setCurrentLang(lang.label);
                        setIsLangOpen(false);
                      }}
                      className="w-full px-3.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-left font-medium cursor-pointer"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Mega Menu Dropdown */}
      <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-3 pb-6 max-h-[80vh] overflow-y-auto shadow-xl">
          {/* Quick Search in Mobile */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search 27 tools (e.g. merge, compress)..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white border-0 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* If mobile search active */}
          {mobileSearch.trim() ? (
            <div className="mb-4">
              <div className="text-[11px] font-bold uppercase text-neutral-400 mb-2">Search Results</div>
              <div className="space-y-1">
                {filteredMobileTools.length > 0 ? (
                  filteredMobileTools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(t.route);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs text-neutral-800 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-[10px] text-neutral-400">{t.category}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-neutral-500 py-2">No matching tools found</div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Primary Mobile Links */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 text-center"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/tools');
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center"
                >
                  All 27 Tools
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/edit-pdf');
                  }}
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 text-center"
                >
                  PDF Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/about');
                  }}
                  className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 text-center"
                >
                  About & Trust
                </button>
              </div>

              {/* Mobile Category Tool Groups */}
              <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {TOOL_CATEGORIES.map((cat) => {
                  const catTools = getToolsByCategory(cat.id);
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="text-[11px] font-bold uppercase text-neutral-400 dark:text-neutral-500">
                        {cat.id}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {catTools.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              navigate(t.route);
                            }}
                            className="text-left p-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 truncate"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Mobile Footer with Language */}
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Globe className="w-3.5 h-3.5" />
              <span>Language: {currentLang}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/help');
              }}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              Help Center
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
