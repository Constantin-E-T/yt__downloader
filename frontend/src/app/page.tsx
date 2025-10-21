import Link from "next/link";
import type { Metadata } from "next";

import { TranscriptMeta, TranscriptTable } from "@/components/transcript-table";
import {
  API_BASE_URL,
  requestTranscript,
  type TranscriptResponse,
} from "@/lib/api/transcripts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "YouTube Transcript Downloader",
  description:
    "Fetch YouTube transcripts quickly and prepare them for AI-powered summaries, extractions, and Q&A.",
};

function normaliseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const videoUrl = normaliseParam(params.video);
  const language = normaliseParam(params.language);
  const query = normaliseParam(params.query);

  let transcriptData: TranscriptResponse | undefined;
  let errorMessage: string | undefined;

  if (videoUrl) {
    const { data, error } = await requestTranscript({
      video_url: videoUrl,
      language,
    });
    transcriptData = data;
    errorMessage = error;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <section className="space-y-4 text-center md:text-left">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          YouTube Transcript Downloader
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Provide a YouTube video URL to fetch the transcript directly from the backend. The result
          is rendered server-side so it is ready for AI summaries, extractions, and Q&amp;A.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form className="flex flex-col gap-4" method="get">
          <div className="flex flex-col gap-2">
            <label htmlFor="video" className="text-sm font-medium text-foreground">
              YouTube Video URL
            </label>
            <input
              id="video"
              name="video"
              type="url"
              required
              defaultValue={videoUrl ?? ""}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="h-11 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="language" className="text-sm font-medium text-foreground">
              Transcript language (optional)
            </label>
            <input
              id="language"
              name="language"
              type="text"
              defaultValue={language ?? ""}
              placeholder="en"
              className="h-11 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default language configured by the backend (English).
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="query" className="text-sm font-medium text-foreground">
              Search transcript (optional)
            </label>
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={query ?? ""}
              placeholder="Find keyword or phrase"
              className="h-11 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Results are filtered server-side. Leave empty to see the full transcript.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Fetch transcript
            </button>
            <span className="text-xs text-muted-foreground">
              Backend: {API_BASE_URL.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </form>

        {errorMessage ? (
          <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
      </section>

      {transcriptData ? (
        <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          {query ? (
            <p className="text-sm text-muted-foreground">
              Showing results containing{" "}
              <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
            </p>
          ) : null}

          <header className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{transcriptData.title}</h2>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Video ID:</span>{" "}
              {transcriptData.video_id}
              <span className="mx-2 text-foreground/40">•</span>
              <span className="font-medium text-foreground">Language:</span>{" "}
              {transcriptData.language.toUpperCase()}
            </div>
            <TranscriptMeta transcript={transcriptData.transcript} />
          </header>

          <TranscriptTable transcript={transcriptData.transcript} query={query} />

          <div className="flex justify-end">
            {(() => {
              const params = new URLSearchParams();
              params.set("transcript", transcriptData.transcript_id);
              if (language) params.set("language", language);
              if (query) params.set("query", query);
              return (
                <Link
                  href={`/transcripts/${transcriptData.video_id}?${params.toString()}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View detailed transcript →
                </Link>
              );
            })()}
          </div>
        </section>
      ) : null}
    </div>
  );
}
