'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  requestTranscript,
  requestTranscriptById,
  type TranscriptResponse,
} from "@/lib/api/transcripts";
import {
  requestSummary,
  type SummaryResponse,
} from "@/lib/api/summaries";
import {
  requestExtraction,
  type ExtractionResponse,
  type ExtractionType,
} from "@/lib/api/extractions";
import { requestQA, type QAResponse } from "@/lib/api/qa";
import { TranscriptMeta, TranscriptTable } from "@/components/transcript-table";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ExtractionPanel } from "@/components/extraction-panel";
import { QASection } from "@/components/qa-section";

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

const EXTRACTION_OPTIONS: Array<{
  value: ExtractionType;
  label: string;
  description: string;
}> = [
  {
    value: "code",
    label: "Extract Code",
    description: "Find relevant code snippets with context.",
  },
  {
    value: "quotes",
    label: "Extract Quotes",
    description: "Highlight impactful quotes and speakers.",
  },
  {
    value: "action_items",
    label: "Extract Action Items",
    description: "Summarise next steps and responsibilities.",
  },
];

const EXTRACTION_VALUES = new Set<ExtractionType>(EXTRACTION_OPTIONS.map((option) => option.value));

const extractionLoadingText: Record<ExtractionType, string> = {
  code: "Extracting code snippets...",
  quotes: "Extracting key quotes...",
  action_items: "Extracting action items...",
};

function normaliseParam(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) {
    return normaliseParam(value[0]);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

const isSummaryType = (value: string | undefined): value is SummaryType =>
  Boolean(value) && SUMMARY_VALUES.has(value as SummaryType);

const isExtractionType = (value: string | undefined): value is ExtractionType =>
  Boolean(value) && EXTRACTION_VALUES.has(value as ExtractionType);

export default function TranscriptPage() {
  const params = useParams<{ videoId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const videoId = useMemo(() => normaliseParam(params?.videoId), [params]);
  const languageParam = useMemo(
    () => normaliseParam(searchParams.get("language")),
    [searchParams]
  );
  const queryParam = useMemo(
    () => normaliseParam(searchParams.get("query")),
    [searchParams]
  );
  const transcriptParam = useMemo(
    () => normaliseParam(searchParams.get("transcript")),
    [searchParams]
  );
  const summaryParam = useMemo(() => {
    const value = normaliseParam(searchParams.get("summary"));
    return isSummaryType(value) ? value : undefined;
  }, [searchParams]);
  const extractionParam = useMemo(() => {
    const value = normaliseParam(searchParams.get("extract"));
    return isExtractionType(value) ? value : undefined;
  }, [searchParams]);
  const qaParams = useMemo(() => {
    const values = searchParams.getAll("qa");
    const normalised = values
      .map((value) => normaliseParam(value))
      .filter((value): value is string => Boolean(value));
    // Deduplicate while preserving order
    return Array.from(new Set(normalised));
  }, [searchParams]);
  const qaParamsKey = useMemo(() => qaParams.join("||"), [qaParams]);

  const [transcriptData, setTranscriptData] = useState<TranscriptResponse | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState(queryParam ?? "");

  const [summaryCache, setSummaryCache] = useState<
    Partial<Record<SummaryType, SummaryResponse>>
  >({});
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [extractionCache, setExtractionCache] = useState<
    Partial<Record<ExtractionType, ExtractionResponse>>
  >({});
  const [activeExtraction, setActiveExtraction] = useState<ExtractionResponse | null>(null);
  const [extractionLoadingType, setExtractionLoadingType] = useState<ExtractionType | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [qaHistory, setQaHistory] = useState<QAResponse[]>([]);
  const qaHistoryRef = useRef<QAResponse[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaBootstrapping, setQaBootstrapping] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const transcriptId = transcriptData?.transcript_id ?? null;
  const transcriptVideoId = transcriptData?.video_id ?? null;

  useEffect(() => {
    setSearchValue(queryParam ?? "");
  }, [queryParam]);

  useEffect(() => {
    qaHistoryRef.current = qaHistory;
  }, [qaHistory]);

  const updateSearchParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      if (!videoId) return;

      const next = new URLSearchParams(searchParams.toString());
      mutator(next);
      const queryString = next.toString();
      const href = queryString ? `/transcripts/${videoId}?${queryString}` : `/transcripts/${videoId}`;
      router.replace(href, { scroll: false });
    },
    [router, searchParams, videoId]
  );

  useEffect(() => {
    if (!videoId) {
      setTranscriptError("Invalid video identifier.");
      setTranscriptLoading(false);
      return;
    }

    const reuseExisting =
      (transcriptId && transcriptParam && transcriptId === transcriptParam) ||
      (!transcriptParam && transcriptVideoId === videoId);

    if (reuseExisting) {
      setTranscriptLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTranscript() {
      setTranscriptLoading(true);
      setTranscriptError(null);

      let cachedError: string | undefined;

      if (transcriptParam) {
        const { data, error } = await requestTranscriptById(transcriptParam);
        if (cancelled) return;
        if (data) {
          setTranscriptData(data);
          setTranscriptLoading(false);
          return;
        }
        cachedError = error;
      }

      const { data, error } = await requestTranscript({
        video_url: `https://youtube.com/watch?v=${videoId}`,
        language: languageParam,
      });
      if (cancelled) return;

      if (data) {
        setTranscriptData(data);
        setTranscriptError(null);
        if (!transcriptParam || transcriptParam !== data.transcript_id) {
          updateSearchParams((params) => {
            params.set("transcript", data.transcript_id);
          });
        }
      } else {
        setTranscriptError(
          error ??
            cachedError ??
            "The transcript could not be retrieved. Please try again from the homepage."
        );
      }

      setTranscriptLoading(false);
    }

    loadTranscript();

    return () => {
      cancelled = true;
    };
  }, [videoId, transcriptParam, languageParam, updateSearchParams, transcriptId, transcriptVideoId]);

  useEffect(() => {
    if (!transcriptId) {
      return;
    }

    setSummaryCache({});
    setSummaryData(null);
    setSummaryError(null);
    setExtractionCache({});
    setActiveExtraction(null);
    setExtractionError(null);
    setQaHistory([]);
    setQaError(null);
    setQaBootstrapping(false);
  }, [transcriptId]);

  const summaryType = summaryParam;
  const cachedSummary = summaryType ? summaryCache[summaryType] : undefined;

  useEffect(() => {
    if (!transcriptId) {
      setSummaryData(null);
      setSummaryLoading(false);
      setSummaryError(null);
      return;
    }

    if (!summaryType) {
      setSummaryData(null);
      setSummaryLoading(false);
      setSummaryError(null);
      return;
    }

    if (
      cachedSummary &&
      cachedSummary.transcript_id === transcriptId
    ) {
      setSummaryData(cachedSummary);
      setSummaryLoading(false);
      setSummaryError(null);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);

    requestSummary({
      transcriptId,
      summaryType,
    })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (data) {
          setSummaryData(data);
          setSummaryCache((prev) => ({ ...prev, [summaryType]: data }));
          setSummaryError(null);
        } else if (error) {
          setSummaryError(error);
          setSummaryData(null);
        } else {
          setSummaryError("Failed to generate summary.");
          setSummaryData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [summaryType, transcriptId, cachedSummary]);

  const cachedExtraction = extractionParam ? extractionCache[extractionParam] : undefined;

  useEffect(() => {
    if (!transcriptId) {
      setActiveExtraction(null);
      setExtractionLoadingType(null);
      setExtractionError(null);
      return;
    }

    if (!extractionParam) {
      setActiveExtraction(null);
      setExtractionLoadingType(null);
      setExtractionError(null);
      return;
    }

    if (
      cachedExtraction &&
      cachedExtraction.transcript_id === transcriptId
    ) {
      setActiveExtraction(cachedExtraction);
      setExtractionLoadingType(null);
      setExtractionError(null);
      return;
    }

    let cancelled = false;
    setExtractionLoadingType(extractionParam);
    setExtractionError(null);

    requestExtraction({
      transcriptId,
      extractionType: extractionParam,
    })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (data) {
          setExtractionCache((prev) => ({ ...prev, [extractionParam]: data }));
          setActiveExtraction(data);
          setExtractionError(null);
        } else if (error) {
          setExtractionError(error);
          setActiveExtraction(null);
        } else {
          setExtractionError("Failed to generate extraction.");
          setActiveExtraction(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setExtractionLoadingType(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [extractionParam, transcriptId, cachedExtraction]);

  useEffect(() => {
    if (qaParams.length === 0) {
      setQaHistory([]);
      return;
    }

    setQaHistory((prev) => {
      const filtered = prev.filter((qa) => qaParams.includes(qa.question));
      if (
        filtered.length === prev.length &&
        filtered.every((item, index) => item === prev[index])
      ) {
        return prev;
      }
      return filtered;
    });
  }, [qaParamsKey, qaParams]);

  useEffect(() => {
    if (!transcriptId) {
      setQaBootstrapping(false);
      return;
    }

    if (qaParams.length === 0) {
      setQaBootstrapping(false);
      return;
    }

    const existingQuestions = new Set(
      qaHistoryRef.current
        .filter((qa) => qa.transcript_id === transcriptId)
        .map((qa) => qa.question)
    );

    const missing = qaParams.filter((question) => !existingQuestions.has(question));

    if (missing.length === 0) {
      setQaBootstrapping(false);
      return;
    }

    let cancelled = false;
    setQaBootstrapping(true);
    setQaError(null);

    (async () => {
      for (const question of missing) {
        const { data, error } = await requestQA({ transcriptId, question });
        if (cancelled) return;

        if (data) {
          setQaHistory((prev) => {
            if (prev.some((item) => item.question === data.question)) {
              return prev;
            }
            return [...prev, data];
          });
        } else if (error) {
          setQaError(error);
        }
      }
      if (!cancelled) {
        setQaBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qaParamsKey, qaParams, transcriptId]);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = searchValue.trim();
      updateSearchParams((params) => {
        if (trimmed) {
          params.set("query", trimmed);
        } else {
          params.delete("query");
        }
      });
    },
    [searchValue, updateSearchParams]
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    updateSearchParams((params) => {
      params.delete("query");
    });
  }, [updateSearchParams]);

  const handleSelectSummary = useCallback(
    (type: SummaryType) => {
      updateSearchParams((params) => {
        params.set("summary", type);
      });
    },
    [updateSearchParams]
  );

  const handleClearSummary = useCallback(() => {
    updateSearchParams((params) => {
      params.delete("summary");
    });
  }, [updateSearchParams]);

  const handleSelectExtraction = useCallback(
    (type: ExtractionType) => {
      updateSearchParams((params) => {
        params.set("extract", type);
      });
    },
    [updateSearchParams]
  );

  const handleClearExtraction = useCallback(() => {
    updateSearchParams((params) => {
      params.delete("extract");
    });
  }, [updateSearchParams]);

  const handleAskQuestion = useCallback(
    async (question: string) => {
      if (!transcriptId) {
        throw new Error("Transcript not ready yet. Please wait.");
      }

      if (qaHistoryRef.current.some((entry) => entry.question === question)) {
        return;
      }

      setQaLoading(true);
      setQaError(null);

      try {
        const { data, error } = await requestQA({
          transcriptId,
          question,
        });

        if (!data || error) {
          const message = error ?? "Failed to generate answer.";
          setQaError(message);
          throw new Error(message);
        }

        setQaHistory((prev) => [...prev, data]);
        updateSearchParams((params) => {
          const existing = params.getAll("qa");
          if (!existing.includes(question)) {
            params.append("qa", question);
          }
        });
      } finally {
        setQaLoading(false);
      }
    },
    [transcriptId, updateSearchParams]
  );

  const handleClearQAHistory = useCallback(() => {
    setQaHistory([]);
    setQaError(null);
    updateSearchParams((params) => {
      params.delete("qa");
    });
  }, [updateSearchParams]);

  const shareUrl = useMemo(() => {
    const id = transcriptVideoId ?? videoId;
    return id ? `https://youtube.com/watch?v=${id}` : undefined;
  }, [transcriptVideoId, videoId]);

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
          {shareUrl ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open on YouTube ↗
            </a>
          ) : null}
        </div>

        {transcriptData ? (
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {transcriptData.title}
            </h1>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Video ID:</span>{" "}
              {transcriptData.video_id}
              <span className="mx-2 text-foreground/40">•</span>
              <span className="font-medium text-foreground">Language:</span>{" "}
              {transcriptData.language.toUpperCase()}
            </div>
            <TranscriptMeta transcript={transcriptData.transcript} />
          </header>
        ) : null}
      </div>

      {transcriptLoading ? (
        <LoadingSpinner text="Fetching transcript..." />
      ) : null}

      {!transcriptLoading && transcriptError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-6">
          <h2 className="text-xl font-semibold text-destructive">
            Unable to load transcript
          </h2>
          <p className="mt-2 text-sm text-destructive/80">{transcriptError}</p>
        </div>
      ) : null}

      {!transcriptLoading && !transcriptError && transcriptData ? (
        <>
          <section className="space-y-4">
            <form className="flex flex-col gap-3" onSubmit={handleSearchSubmit}>
              <div>
                <label htmlFor="query" className="text-sm font-medium text-foreground">
                  Search transcript
                </label>
                <input
                  id="query"
                  name="query"
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
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
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
                >
                  Clear
                </button>
              </div>
            </form>

            {queryParam ? (
              <p className="text-sm text-muted-foreground">
                Showing results containing{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{queryParam}&rdquo;
                </span>
                .
              </p>
            ) : null}

            <TranscriptTable transcript={transcriptData.transcript} query={queryParam} />
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">AI summary</h2>
              <p className="text-sm text-muted-foreground">
                Generate cached summaries via the backend AI service. Repeat requests reuse cached results for faster responses.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {SUMMARY_OPTIONS.map((option) => {
                const isActive = summaryType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectSummary(option.value)}
                    className={`flex min-w-[180px] flex-1 cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-foreground hover:border-primary/60 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-semibold capitalize">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                );
              })}

              {summaryType ? (
                <button
                  type="button"
                  onClick={handleClearSummary}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
                >
                  Clear summary
                </button>
              ) : null}
            </div>

            {summaryError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {summaryError}
              </div>
            ) : null}

            {summaryLoading ? (
              <LoadingSpinner text="Generating summary..." />
            ) : null}

            {!summaryType ? (
              <p className="text-sm text-muted-foreground">
                Select a summary type above to generate an AI summary.
              </p>
            ) : null}

            {!summaryLoading && summaryType && summaryData ? (
              <SummaryPanel summary={summaryData} />
            ) : null}
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Content Extraction</h2>
              <p className="text-sm text-muted-foreground">
                Identify code snippets, key quotes, or actionable next steps sourced from the transcript.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {EXTRACTION_OPTIONS.map((option) => {
                const isActive = extractionParam === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectExtraction(option.value)}
                    className={`flex min-w-[180px] flex-1 cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-foreground hover:border-primary/60 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-semibold capitalize">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                );
              })}
              {extractionParam ? (
                <button
                  type="button"
                  onClick={handleClearExtraction}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
                >
                  Clear extraction
                </button>
              ) : null}
            </div>

            {extractionError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {extractionError}
              </div>
            ) : null}

            {extractionLoadingType ? (
              <LoadingSpinner text={extractionLoadingText[extractionLoadingType]} />
            ) : null}

            {!extractionParam ? (
              <p className="text-sm text-muted-foreground">
                Choose an extraction type above to analyse the transcript.
              </p>
            ) : null}

            {!extractionLoadingType && activeExtraction ? (
              <ExtractionPanel data={activeExtraction} />
            ) : null}
          </section>

          <QASection
            transcriptId={transcriptData.transcript_id}
            qaHistory={qaHistory}
            onAskQuestion={handleAskQuestion}
            onClearHistory={handleClearQAHistory}
            loading={qaLoading}
            bootstrapping={qaBootstrapping}
            error={qaError}
          />
        </>
      ) : null}
    </div>
  );
}

function SummaryPanel({ summary }: { summary: SummaryResponse }) {
  if (!summary) return null;

  const content = summary.content;

  return (
    <div className="space-y-4 text-sm text-foreground">
      {content.text ? (
        <p className="text-base leading-relaxed text-foreground/90">{content.text}</p>
      ) : null}

      {content.key_points && content.key_points.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Key points
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-foreground/90">
            {content.key_points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {content.sections && content.sections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sections
          </h3>
          <div className="space-y-3">
            {content.sections.map((section, index) => (
              <div
                key={`${section.title}-${index}`}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <p className="text-sm font-semibold text-foreground/90">
                  {section.title || `Section ${index + 1}`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Model:{" "}
          <span className="font-medium text-foreground/80">{summary.model}</span>
        </span>
        <span className="text-foreground/30">•</span>
        <span>
          Tokens used:{" "}
          <span className="font-medium text-foreground/80">
            {summary.tokens_used.toLocaleString()}
          </span>
        </span>
        <span className="text-foreground/30">•</span>
        <span>{new Date(summary.created_at).toLocaleString()}</span>
      </div>
    </div>
  );
}
