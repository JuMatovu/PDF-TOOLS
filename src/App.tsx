import React from 'react';
import { RouterProvider, useRouter } from './hooks/useRouter';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { AllToolsPage } from './pages/AllToolsPage';
import { ToolPage } from './pages/ToolPage';
import { EditorPage } from './pages/EditorPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { HelpPage } from './pages/HelpPage';
import { getToolBySlug } from './data/tools';
import { ArrowLeft, Search } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { currentPath, toolSlug, navigate } = useRouter();

  // If viewing the full-screen interactive PDF Editor shell
  if (currentPath === '/edit-pdf' || currentPath === '/tools/edit-pdf') {
    return <EditorPage />;
  }

  // Render respective page
  const renderCurrentView = () => {
    // 1. Home
    if (currentPath === '/') {
      return <HomePage />;
    }

    // 2. All Tools Directory
    if (currentPath === '/tools') {
      return <AllToolsPage />;
    }

    // 3. Dynamic Tool Page (/tools/:slug)
    if (toolSlug) {
      const tool = getToolBySlug(toolSlug);
      if (tool) {
        return <ToolPage tool={tool} />;
      }
      // If tool slug not found in registry
      return (
        <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="text-4xl font-extrabold text-neutral-900 dark:text-white">404</div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Tool Not Found
          </h2>
          <p className="text-sm text-neutral-500">
            The tool "{toolSlug}" was not found or has been moved.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse all 27 tools</span>
            </button>
          </div>
        </div>
      );
    }

    // 4. Secondary Pages
    if (currentPath === '/about') {
      return <AboutPage />;
    }
    if (currentPath === '/blog') {
      return <BlogPage />;
    }
    if (currentPath === '/help') {
      return <HelpPage />;
    }

    // 5. General Fallback
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors selection:bg-green-100 selection:text-green-900 dark:selection:bg-green-900 dark:selection:text-green-100">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          {renderCurrentView()}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
