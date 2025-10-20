import { A } from '@solidjs/router';

import Card from '@/components/ui/Card';

export const HistoryEmptyState = () => (
  <Card variant="outlined" padding="lg" class="space-y-4 text-white/70 dark:text-slate-300">
    <div class="flex items-center gap-3 text-white dark:text-slate-100">
      <span aria-hidden="true" class="text-3xl">
        🗂️
      </span>
      <div>
        <h2 class="text-2xl font-semibold">No downloads yet</h2>
        <p class="text-sm text-white/60 dark:text-slate-300">
          Start by fetching your first transcript via the download interface. We’ll display each
          request with metadata, languages, and export options here.
        </p>
      </div>
    </div>
    <A
      href="/download"
      class="hover:border-primary-400 focus-visible:outline-primary-300 dark:hover:border-primary-400 inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:text-slate-200"
    >
      Start downloading
    </A>
  </Card>
);

export default HistoryEmptyState;
