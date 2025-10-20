import { For, Show } from 'solid-js';

import Card from '@/components/ui/Card';
import { TranscriptSkeleton } from '@/components/ui/Skeleton';
import type { Transcript } from '@/types/api';
import { formatRelativeTime, formatTime } from '@/utils/format';

type TranscriptPreviewProps = {
  transcript: Transcript | null;
  createdAt?: string;
  isLoading: boolean;
};

export const TranscriptPreview = (props: TranscriptPreviewProps) => (
  <Card class="space-y-4 bg-surface-800/60" padding="lg" aria-live="polite">
    <h3 class="text-lg font-semibold text-white">Latest response preview</h3>
    <Show when={!props.isLoading} fallback={<TranscriptSkeleton />}>
      <Show
        when={props.transcript}
        fallback={
          <p class="text-sm text-white/60">
            Results will surface here with metadata, language, and fetch timestamp.
          </p>
        }
      >
        {(transcript) => (
          <div class="space-y-3 text-sm text-white/80">
            <div>
              <span class="block text-white/60">Language</span>
              <span class="font-medium text-white">{transcript().language.toUpperCase()}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-white/60">Segments</span>
                <span class="font-medium text-white">{transcript().content.length}</span>
              </div>
              <div>
                <span class="block text-white/60">Fetched</span>
                <span class="font-medium text-white">
                  {formatRelativeTime(props.createdAt ?? new Date().toISOString())}
                </span>
              </div>
            </div>
            <div class="max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-surface-900/70 p-3">
              <For each={transcript().content.slice(0, 4)}>
                {(segment) => (
                  <p class="text-xs leading-relaxed text-white/70">
                    <span class="text-primary-200 font-mono">{formatTime(segment.start / 1000)}</span> —{' '}
                    {segment.text}
                  </p>
                )}
              </For>
              <Show when={transcript().content.length > 4}>
                <p class="pt-2 text-xs text-white/50">
                  + more segments available via API response.
                </p>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </Show>
  </Card>
);

export default TranscriptPreview;
