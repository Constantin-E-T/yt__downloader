import { onCleanup, onMount, Show, createSignal } from 'solid-js';

import Card from '@/components/ui/Card';
import { TranscriptFetcher } from '@/components/features/TranscriptFetcher';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { TranscriptSkeleton } from '@/components/ui/Skeleton';
import { storage } from '@/services/storage';
import type { HistoryItem, TranscriptResponse } from '@/types/api';

const toResponse = (item: HistoryItem): TranscriptResponse => ({
  video: item.video,
  transcript: item.transcript,
});

const Download = () => {
  const [isLoading, setIsLoading] = createSignal(false);
  const [active, setActive] = createSignal<TranscriptResponse | null>(null);

  onMount(() => {
    const existing = storage.getHistory();
    if (existing.length > 0) {
      setActive(toResponse(existing[0]));
    }
    const unsubscribe = storage.subscribe((items) => {
      if (items.length > 0) {
        setActive(toResponse(items[0]));
      }
    });
    onCleanup(unsubscribe);
  });

  return (
    <section class="space-y-12">
      <header class="space-y-4">
        <p class="text-primary-200 text-sm uppercase tracking-[0.3em]">Transcript workspace</p>
        <h1 class="text-4xl font-bold text-white md:text-5xl">Download transcripts effortlessly</h1>
        <p class="max-w-2xl text-lg text-white/70">
          Paste any YouTube URL, choose your language preferences, and prepare transcript data
          that’s ready for summarisation, analytics, or downstream automation.
        </p>
      </header>

      <div class="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Card variant="elevated" padding="lg" class="p-0">
          <TranscriptFetcher
            onSuccess={(response) => setActive(response)}
            onLoadingChange={(loading) => setIsLoading(loading)}
            showPreview={false}
          />
        </Card>

        <Show when={!isLoading()} fallback={<TranscriptSkeleton />}>
          <Show
            when={active()}
            fallback={
              <Card
                variant="outlined"
                padding="lg"
                class="space-y-4 text-sm text-white/70 dark:text-slate-200"
              >
                <h2 class="text-lg font-semibold text-white">No transcript yet</h2>
                <p>
                  Submit a YouTube URL to fetch a transcript. The most recent result will appear
                  here automatically.
                </p>
                <p class="text-white/50">
                  Tip: All downloads are saved locally so you can revisit them anytime.
                </p>
              </Card>
            }
          >
            {(response) => (
              <TranscriptViewer video={response().video} transcript={response().transcript} />
            )}
          </Show>
        </Show>
      </div>
    </section>
  );
};

export default Download;
