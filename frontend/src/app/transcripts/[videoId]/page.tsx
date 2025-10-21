import { notFound } from "next/navigation";
import Link from "next/link";

import { requestTranscript } from "@/lib/api/transcripts";
import { requestSummary } from "@/lib/api/summaries";
import type { SummaryResponse } from "@/lib/api/summaries";
import { TranscriptTable, TranscriptMeta } from "@/components/transcript-table";

type PageProps = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

const SUMMARY_OPTIONS = [
  {
    value: "brief",
    label: "Brief overview",
    description: "High-level recap in a few sentences.",
  },
  {
    value: "detailed",
    label: "Detailed synopsis",
    description: "Narrative summary covering major sections.",
  },
  {
    value: "key_points",
    label: "Key takeaways",
    description: "Bullet points for quick scanning.",
  },
] as const;

type SummaryType = (typeof SUMMARY_OPTIONS)[number]["value"];

const SUMMARY_VALUES = new Set<SummaryType>(SUMMARY_OPTIONS.map((option) => option.value));

const isSummaryType = (value: string | undefined): value is SummaryType =>
  Boolean(value) && SUMMARY_VALUES.has(value as SummaryType);

export default async function TranscriptPage({ params, searchParams }: PageProps) {
  const { videoId } = await params;
  const queryParams = await searchParams;
  const language = normaliseParam(queryParams.language);
  const query = normaliseParam(queryParams.query);
  const transcriptParam = normaliseParam(queryParams.transcript);
  const summaryParam = normaliseParam(queryParams.summary);
  const summaryType = isSummaryType(summaryParam) ? summaryParam : undefined;

  if (!videoId) {
    notFound();
  }

  const { data, error } = await requestTranscript({ video_url: `https://youtube.com/watch?v=${videoId}`, language });

  if (!data) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to fetcher
        </Link>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-6">
          <h1 className="text-xl font-semibold text-destructive">Unable to load transcript</h1>
          <p className="mt-2 text-sm text-destructive/80">
            {error ?? "The transcript could not be retrieved. Please try again from the homepage."}
          </p>
        </div>
      </div>
    );
  }

  const shareUrl = new URL(`https://youtube.com/watch?v=${data.video_id}`);
  const transcriptId = transcriptParam ?? data.transcript_id;

  let summaryData: SummaryResponse | undefined;
  let summaryError: string | undefined;
  if (summaryType) {
    const { data: generatedSummary, error: summaryErr } = await requestSummary({
      transcriptId,
      summaryType,
    });
    summaryData = generatedSummary;
    summaryError = summaryErr;
  }

  const baseParams = new URLSearchParams();
  baseParams.set("transcript", transcriptId);
  if (language) baseParams.set("language", language);
  if (query) baseParams.set("query", query);
  if (summaryType) baseParams.set("summary", summaryType);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to fetcher
          </Link>
          <a
            href={shareUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Open on YouTube ↗
          </a>
        </div>
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{data.title}</h1>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Video ID:</span> {data.video_id}
            <span className="mx-2 text-foreground/40">•</span>
            <span className="font-medium text-foreground">Language:</span> {data.language.toUpperCase()}
          </div>
          <TranscriptMeta transcript={data.transcript} />
        </header>
      </div>

      <section className="space-y-4">
        <form className="flex flex-col gap-3" method="get">
          <input type="hidden" name="transcript" value={transcriptId} />
          {language ? <input type="hidden" name="language" value={language} /> : null}
          {summaryType ? <input type="hidden" name="summary" value={summaryType} /> : null}
          <div>
            <label htmlFor="query" className="text-sm font-medium text-foreground">
              Search transcript
            </label>
            <input
              id="query"
              name="query"
              type="text"
              defaultValue={query ?? ""}
              placeholder="Keyword or phrase"
              className="mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Apply search
            </button>
            <Link
              href={`/transcripts/${data.video_id}?${(() => {
                const params = new URLSearchParams();
                params.set("transcript", transcriptId);
                if (language) params.set("language", language);
                if (summaryType) params.set("summary", summaryType);
                return params.toString();
              })()}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              Clear
            </Link>
          </div>
        </form>

        {query ? (
          <p className="text-sm text-muted-foreground">
            Showing results containing <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
          </p>
        ) : null}

        <TranscriptTable transcript={data.transcript} query={query} />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">AI summary</h2>
          <p className="text-sm text-muted-foreground">
            Generate cached summaries via the backend AI service. Each type is stored server-side, so repeat requests reuse previous results.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {SUMMARY_OPTIONS.map((option) => {
            const params = new URLSearchParams(baseParams);
            params.set("summary", option.value);
            const isActive = summaryType === option.value;
            return (
              <Link
                key={option.value}
                href={`/transcripts/${data.video_id}?${params.toString()}`}
                className={`flex min-w-[180px] flex-1 cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-foreground hover:border-primary/60 hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-semibold capitalize">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </Link>
            );
          })}

          {summaryType ? (
            <Link
              href={`/transcripts/${data.video_id}?${(() => {
                const params = new URLSearchParams(baseParams);
                params.delete("summary");
                return params.toString();
              })()}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              Clear summary
            </Link>
          ) : null}
        </div>

        {summaryType ? (
          summaryError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {summaryError}
            </div>
          ) : summaryData ? (
            <SummaryPanel summary={summaryData} />
          ) : (
            <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Generating summary…
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Select a summary type above to generate an AI summary.</p>
        )}
      </section>
    </div>
  );
}

function SummaryPanel({ summary }: { summary: SummaryResponse }) {
  if (!summary) return null;

  const content = summary.content;

  return (
    <div className="space-y-4 text-sm text-foreground">
      {content.text ? <p className="text-base leading-relaxed text-foreground/90">{content.text}</p> : null}

      {content.key_points && content.key_points.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key points</h3>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            {content.key_points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.sections && content.sections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sections</h3>
          <div className="space-y-3">
            {content.sections.map((section, index) => (
              <div key={`${section.title}-${index}`} className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground/90">{section.title || `Section ${index + 1}`}</p>
                <p className="mt-1 text-sm text-muted-foreground">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <span>Model: <span className="font-medium text-foreground/80">{summary.model}</span></span>
        <span className="text-foreground/30">•</span>
        <span>Tokens used: <span className="font-medium text-foreground/80">{summary.tokens_used}</span></span>
        <span className="text-foreground/30">•</span>
        <span>Generated: {new Date(summary.created_at).toLocaleString()}</span>
      </div>
    </div>
  );
}
