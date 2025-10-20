import { createMutation } from '@tanstack/solid-query';
import { Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import TranscriptPreview from '@/components/features/TranscriptPreview';
import LanguageSelect from '@/components/features/LanguageSelect';
import Button from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { LANGUAGES } from '@/data/languages';
import { transcriptApi, ApiClientError } from '@/services/api';
import { storage } from '@/services/storage';
import type { TranscriptResponse } from '@/types/api';
import { useIndeterminateProgress } from '@/hooks/useProgress';
import { extractVideoId, isValidYouTubeUrl } from '@/utils/format';

type TranscriptFetcherProps = {
  onSuccess?: (response: TranscriptResponse) => void;
  showPreview?: boolean;
  onLoadingChange?: (loading: boolean) => void;
};

export const TranscriptFetcher = (props: TranscriptFetcherProps) => {
  const [videoUrl, setVideoUrl] = createSignal('');
  const [language, setLanguage] = createSignal<string>(LANGUAGES[0].value);
  const [clientError, setClientError] = createSignal<string | null>(null);
  const [result, setResult] = createSignal<TranscriptResponse | null>(null);
  const [wasSuccessful, setWasSuccessful] = createSignal(false);
  const toast = useToast();
  let successTimer: number | undefined;

  const videoId = createMemo(() => extractVideoId(videoUrl()));

  const mutation = createMutation(() => ({
    mutationKey: ['transcripts', 'fetch', videoUrl(), language()],
    mutationFn: async () =>
      transcriptApi.fetchTranscript({
        video_url: videoUrl().trim(),
        language: language(),
      }),
    onSuccess: (data) => {
      storage.saveToHistory(data);
      if (props.showPreview !== false) {
        setResult(data);
      }
      props.onSuccess?.(data);
      setWasSuccessful(true);
      successTimer = window.setTimeout(() => setWasSuccessful(false), 1500);
      toast.addToast({
        type: 'success',
        title: 'Transcript ready',
        description: `${data.video.title} fetched successfully.`,
      });
    },
    onError: (error) => {
      setWasSuccessful(false);
      const message =
        error instanceof ApiClientError ? error.message : 'Unexpected error occurred.';
      toast.addToast({ type: 'error', title: 'Failed to fetch transcript', description: message });
    },
  }));

  onCleanup(() => {
    if (successTimer) {
      window.clearTimeout(successTimer);
    }
  });

  const preview = createMemo(() => result()?.transcript ?? null);
  const isLoading = () => mutation.isPending;
  const progress = useIndeterminateProgress(isLoading);

  const errorMessage = createMemo(() => {
    if (clientError()) {
      return clientError();
    }
    const error = mutation.error;
    if (error instanceof ApiClientError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return null;
  });

  createEffect(() => {
    props.onLoadingChange?.(isLoading());
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setWasSuccessful(false);
    const url = videoUrl().trim();
    if (!url) {
      setClientError('Paste a YouTube URL to continue.');
      return;
    }
    if (!isValidYouTubeUrl(url)) {
      setClientError('Invalid YouTube URL. Please double-check and try again.');
      return;
    }
    setClientError(null);
    setResult(null);
    try {
      await mutation.mutateAsync();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setClientError(error.message);
      } else if (error instanceof Error) {
        setClientError(error.message);
      } else {
        setClientError('Unable to fetch transcript right now. Please try again.');
      }
    }
  };

  return (
    <section
      id="api"
      class="grid gap-6 rounded-3xl border border-white/5 bg-surface-900/80 p-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:grid-cols-[1.2fr_1fr] md:p-10 lg:gap-12"
      aria-labelledby="transcript-intake"
    >
      <form class="space-y-6" onSubmit={handleSubmit} aria-describedby="fetcher-help">
        <div class="space-y-2">
          <h2 id="transcript-intake" class="text-2xl font-semibold text-white dark:text-slate-100">
            Fetch a transcript instantly
          </h2>
          <p id="fetcher-help" class="text-sm text-white/70 dark:text-slate-300">
            Paste a YouTube link, choose your language, and receive structured transcript data ready
            for downstream tooling.
          </p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-white/80 dark:text-slate-200" for="video-url">
            YouTube URL
          </label>
          <input
            id="video-url"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            required
            class="w-full rounded-xl border border-white/10 bg-surface-800/90 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 dark:border-slate-700 dark:bg-slate-900/80"
            value={videoUrl()}
            onInput={(event) => setVideoUrl(event.currentTarget.value)}
            aria-invalid={Boolean(errorMessage())}
          />
        </div>

        <div class="space-y-2">
          <span class="text-sm font-medium text-white/80 dark:text-slate-200">Language</span>
          <LanguageSelect value={language()} onChange={setLanguage} />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            class="w-full justify-center sm:w-auto"
            loading={isLoading()}
            leftIcon={wasSuccessful() ? <span aria-hidden="true">✓</span> : undefined}
          >
            {wasSuccessful() ? 'Fetched!' : 'Fetch transcript'}
          </Button>
          <p class="text-xs text-white/50 dark:text-slate-400" aria-live="polite">
            Secure HTTPS requests. No transcripts stored client-side.
          </p>
        </div>

        <Show when={isLoading()}>
          <ProgressBar progress={progress()} label="Fetching transcript…" />
        </Show>

        {errorMessage() && (
          <p role="alert" class="text-sm text-rose-300 dark:text-rose-200">
            {errorMessage()}
          </p>
        )}

        {videoId() && (
          <p class="text-xs text-white/40 dark:text-slate-400" aria-live="polite">
            Detected video ID: {videoId()}
          </p>
        )}
      </form>

      {props.showPreview !== false && (
        <TranscriptPreview
          transcript={preview()}
          createdAt={result()?.transcript.createdAt}
          isLoading={isLoading()}
        />
      )}
    </section>
  );
};

export default TranscriptFetcher;
