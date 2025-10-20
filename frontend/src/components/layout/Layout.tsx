import { createEffect, type ParentComponent } from 'solid-js';
import { useLocation } from '@solidjs/router';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export const Layout: ParentComponent = (props) => {
  const location = useLocation();

  createEffect(() => {
    // Scroll to top on route change for smooth UX.
    const pathname = location.pathname;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return pathname;
  });

  return (
    <div class="flex min-h-screen flex-col bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 text-slate-50 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 transition-colors duration-300 sm:px-6 lg:px-8 lg:py-16"
      >
        {props.children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
