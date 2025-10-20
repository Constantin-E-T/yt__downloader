/* @refresh reload */
import { Suspense } from 'solid-js';
import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

import App from '@/App';
import { ToastProvider } from '@/components/ui/Toast';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

const root = document.getElementById('root');

if (!(root instanceof HTMLElement)) {
  throw new Error('Root element not found. Ensure #root exists in index.html.');
}

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Suspense
            fallback={<div class="p-12 text-center text-white/70">Loading experience…</div>}
          >
            <App />
          </Suspense>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  ),
  root
);
