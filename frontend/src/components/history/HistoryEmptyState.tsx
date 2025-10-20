import { A } from '@solidjs/router';

import Card from '@/components/ui/Card';

export const HistoryEmptyState = () => (
  <Card variant="outlined" padding="lg" class="space-y-4 text-white/70 dark:text-slate-300 animate-fade-in">
    <div class="text-center py-12">
      <div class="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 animate-bounce-slow">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No downloads yet</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Start by fetching your first transcript via the download interface. We'll display each
        request with metadata, languages, and export options here.
      </p>
      <A
        href="/download"
        class="hover:border-primary-400 focus-visible:outline-primary-300 dark:hover:border-primary-400 inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition-all duration-200 hover:text-white hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:text-slate-200"
      >
        Start downloading
      </A>
    </div>
  </Card>
);

export default HistoryEmptyState;
