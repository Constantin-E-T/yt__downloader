import { For, Show, createMemo, createSignal } from 'solid-js';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import type { Transcript, Video } from '@/types/api';
import { formatDuration, formatTime } from '@/utils/format';

const buildTextExport = (video: Video, transcript: Transcript): string => {
  const header = `Title: ${video.title}\nChannel: ${video.channel}\nLanguage: ${transcript.language}\nDuration: ${formatDuration(video.duration)}\n`;
  const segments = transcript.content
    .map((segment) => `[${formatTime(segment.start / 1000)}] ${segment.text}`)
    .join('\n');
  return `${header}\n${segments}`;
};

type TranscriptViewerProps = {
  video: Video;
  transcript: Transcript;
};

export const TranscriptViewer = (props: TranscriptViewerProps) => {
  const toast = useToast();
  const [query, setQuery] = createSignal('');
  const [copied, setCopied] = createSignal(false);

  const filteredSegments = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) {
      return props.transcript.content;
    }
    return props.transcript.content.filter((segment) => segment.text.toLowerCase().includes(q));
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildTextExport(props.video, props.transcript));
      setCopied(true);
      toast.addToast({
        type: 'success',
        title: 'Transcript copied',
        description: 'All segments copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard copy failed', error);
      toast.addToast({
        type: 'error',
        title: 'Copy failed',
        description: 'Unable to copy transcript to clipboard.',
      });
    }
  };

  const exportAsText = () => {
    const blob = new Blob([buildTextExport(props.video, props.transcript)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${props.video.youtubeId || props.video.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.addToast({
      type: 'success',
      title: 'Exported as TXT',
      description: 'Transcript saved as text file.',
    });
  };

  const exportAsJson = () => {
    const data = JSON.stringify(props.transcript, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${props.video.youtubeId || props.video.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.addToast({
      type: 'success',
      title: 'Exported as JSON',
      description: 'Transcript saved as JSON file.',
    });
  };

  return (
    <Card class="space-y-6 bg-surface-900/80 p-6">
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-primary-200 text-sm uppercase tracking-[0.3em]">Transcript preview</p>
          <h2 class="text-2xl font-semibold text-white">{props.video.title}</h2>
          <p class="text-sm text-white/60">{props.video.channel}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={copyToClipboard}>
            {copied() ? (
              <>
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              'Copy all'
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={exportAsText}>
            Export TXT
          </Button>
          <Button variant="secondary" size="sm" onClick={exportAsJson}>
            Export JSON
          </Button>
        </div>
      </header>

      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p class="text-sm text-white/60">
          Language:{' '}
          <span class="font-semibold text-white">{props.transcript.language.toUpperCase()}</span>
        </p>
        <label class="focus-within:border-primary-400 flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/10 bg-surface-800/80 px-4 py-2 text-sm text-white/70">
          <span class="text-white/50">Search</span>
          <input
            type="search"
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="Find text…"
            class="flex-1 bg-transparent text-white focus:outline-none"
          />
        </label>
      </div>

      <div class="max-h-96 space-y-3 overflow-y-auto pr-2">
        <Show
          when={filteredSegments().length}
          fallback={<p class="text-sm text-white/60">No matching transcript segments.</p>}
        >
          <For each={filteredSegments()}>
            {(segment) => (
              <div class="rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/80">
                <span class="text-primary-200 font-mono">{formatTime(segment.start / 1000)}</span>
                <span class="ml-2 text-white/90">{segment.text}</span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </Card>
  );
};

export default TranscriptViewer;
