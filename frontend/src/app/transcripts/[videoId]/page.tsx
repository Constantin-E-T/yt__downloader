"use client";

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
import { requestSummary, type SummaryResponse } from "@/lib/api/summaries";
import {
  requestExtraction,
  type ExtractionResponse,
  type ExtractionType,
} from "@/lib/api/extractions";
import { requestQA, type QAResponse } from "@/lib/api/qa";
import { TranscriptMeta } from "@/components/transcript-table";
import {
  YouTubePlayer,
  type YouTubePlayerRef,
} from "@/components/youtube-player";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryPanel } from "./components/summary-panel";
import { TranscriptTab } from "./components/transcript-tab";
import { AIAnalysisTab } from "./components/ai-analysis-tab";
import { SearchTab } from "./components/search-tab";
import { ExportTab } from "./components/export-tab";
import {
  SUMMARY_OPTIONS,
  EXTRACTION_OPTIONS,
  extractionLoadingText,
} from "./constants";
import type { SummaryType, AITab } from "./types";

const SUMMARY_VALUES = new Set<SummaryType>(
  SUMMARY_OPTIONS.map((option) => option.value)
);

const EXTRACTION_VALUES = new Set<ExtractionType>(
  EXTRACTION_OPTIONS.map((option) => option.value)
);

const TAB_OPTIONS = ["transcript", "ai", "search", "export"] as const;
type TabKey = (typeof TAB_OPTIONS)[number];
const TAB_VALUES = new Set<TabKey>(TAB_OPTIONS);

const AI_TAB_VALUES = new Set<AITab>(["summary", "extract", "qa"]);

function normaliseParam(
  value: string | string[] | null | undefined
): string | undefined {
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

const isTabKey = (value: string | undefined): value is TabKey =>
  Boolean(value) && TAB_VALUES.has(value as TabKey);

const isAITabKey = (value: string | undefined): value is AITab =>
  Boolean(value) && AI_TAB_VALUES.has(value as AITab);

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
  const tabParam = useMemo(() => {
    const value = normaliseParam(searchParams.get("tab"));
    return isTabKey(value) ? value : undefined;
  }, [searchParams]);
  const aiTabParam = useMemo(() => {
    const value = normaliseParam(searchParams.get("aiTab"));
    return isAITabKey(value) ? value : undefined;
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

  const [transcriptData, setTranscriptData] =
    useState<TranscriptResponse | null>(null);
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
  const [activeExtraction, setActiveExtraction] =
    useState<ExtractionResponse | null>(null);
  const [extractionLoadingType, setExtractionLoadingType] =
    useState<ExtractionType | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [qaHistory, setQaHistory] = useState<QAResponse[]>([]);
  const qaHistoryRef = useRef<QAResponse[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaBootstrapping, setQaBootstrapping] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(
    () => tabParam ?? "transcript"
  );
  const [activeAITab, setActiveAITab] = useState<AITab>(
    () => aiTabParam ?? "summary"
  );
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const playerRef = useRef<YouTubePlayerRef>(null);

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
      const href = queryString
        ? `/transcripts/${videoId}?${queryString}`
        : `/transcripts/${videoId}`;
      router.replace(href, { scroll: false });
    },
    [router, searchParams, videoId]
  );

  const handleSeek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

  const handleTimeUpdate = useCallback((seconds: number) => {
    setCurrentVideoTime(seconds);
  }, []);

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
  }, [
    videoId,
    transcriptParam,
    languageParam,
    updateSearchParams,
    transcriptId,
    transcriptVideoId,
  ]);

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

    if (cachedSummary && cachedSummary.transcript_id === transcriptId) {
      setSummaryData(cachedSummary);
      setSummaryLoading(false);
      setSummaryError(null);
      return;
    }

    // Guard: Don't make request if transcriptId is null/undefined
    if (!transcriptId) {
      setSummaryLoading(false);
      setSummaryError("Transcript ID not available. Please try again.");
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

  const cachedExtraction = extractionParam
    ? extractionCache[extractionParam]
    : undefined;

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

    if (cachedExtraction && cachedExtraction.transcript_id === transcriptId) {
      setActiveExtraction(cachedExtraction);
      setExtractionLoadingType(null);
      setExtractionError(null);
      return;
    }

    // Guard: Don't make request if transcriptId is null/undefined
    if (!transcriptId) {
      setExtractionLoadingType(null);
      setExtractionError("Transcript ID not available. Please try again.");
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

    const missing = qaParams.filter(
      (question) => !existingQuestions.has(question)
    );

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
      setActiveTab("ai");
      setActiveAITab("summary");
      updateSearchParams((params) => {
        params.set("tab", "ai");
        params.set("aiTab", "summary");
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
      setActiveTab("ai");
      setActiveAITab("extract");
      updateSearchParams((params) => {
        params.set("tab", "ai");
        params.set("aiTab", "extract");
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

      setActiveTab("ai");
      setActiveAITab("qa");
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
          params.set("tab", "ai");
          params.set("aiTab", "qa");
          const existing = params.getAll("qa");
          if (!existing.includes(question)) {
            params.append("qa", question);
          }
        });
      } finally {
        setQaLoading(false);
      }
    },
    [setActiveAITab, setActiveTab, transcriptId, updateSearchParams]
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

  const resolvedVideoId = transcriptData?.video_id ?? videoId ?? null;
  const transcriptReady = Boolean(transcriptData) && !transcriptError;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <aside className="w-full lg:w-[400px] lg:shrink-0">
        <div className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Video Player
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="px-4 pb-4">
                {resolvedVideoId ? (
                  <YouTubePlayer
                    ref={playerRef}
                    videoId={resolvedVideoId}
                    onTimeUpdate={handleTimeUpdate}
                  />
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-snug">
                {transcriptData?.title ?? "Transcript details"}
              </CardTitle>
              <CardDescription>
                Keep the key metadata handy while you explore the transcript.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {transcriptData ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {transcriptData.language.toUpperCase()}
                    </Badge>
                    <Separator
                      orientation="vertical"
                      className="hidden h-4 lg:block"
                    />
                    <span className="text-muted-foreground">
                      {transcriptData.transcript.length.toLocaleString()} lines
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">
                        Video ID:
                      </span>{" "}
                      <span className="font-mono">
                        {transcriptData.video_id}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">
                        Transcript ID:
                      </span>{" "}
                      <span className="font-mono">
                        {transcriptData.transcript_id}
                      </span>
                    </p>
                  </div>
                  <TranscriptMeta transcript={transcriptData.transcript} />
                  {shareUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-center"
                    >
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open on YouTube
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              ← Back to fetcher
            </Link>
            {shareUrl ? (
              <Button
                variant="ghost"
                asChild
                className="h-auto px-0 text-sm font-medium text-primary hover:text-primary"
              >
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube ↗
                </a>
              </Button>
            ) : null}
          </div>

          {transcriptData ? (
            <header className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {transcriptData.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Navigate the transcript, AI insights, and search tools without
                losing your place in the video.
              </p>
            </header>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
        </div>

        {transcriptError ? (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">
                Unable to load transcript
              </CardTitle>
              <CardDescription className="text-destructive/80">
                {transcriptError}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {transcriptLoading && !transcriptData ? (
          <Card className="border-dashed">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-[440px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ) : null}

        {transcriptReady && transcriptData ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (isTabKey(value)) {
                setActiveTab(value);
                updateSearchParams((params) => {
                  params.set("tab", value);
                  if (value !== "ai") {
                    params.delete("aiTab");
                  }
                });
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transcript">
                <span className="hidden sm:inline">📝 Transcript</span>
                <span className="sm:hidden">📝</span>
              </TabsTrigger>
              <TabsTrigger value="ai">
                <span className="hidden sm:inline">🤖 AI Analysis</span>
                <span className="sm:hidden">🤖</span>
              </TabsTrigger>
              <TabsTrigger value="search">
                <span className="hidden sm:inline">🔍 Search</span>
                <span className="sm:hidden">🔍</span>
              </TabsTrigger>
              <TabsTrigger value="export">
                <span className="hidden sm:inline">💾 Export</span>
                <span className="sm:hidden">💾</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-6">
              <TranscriptTab
                transcript={transcriptData.transcript}
                currentTime={currentVideoTime}
                onSeek={handleSeek}
              />
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <AIAnalysisTab
                activeAITab={activeAITab}
                onAITabChange={(value) => {
                  if (isAITabKey(value)) {
                    setActiveAITab(value);
                    updateSearchParams((params) => {
                      params.set("aiTab", value);
                    });
                  }
                }}
                summaryType={summaryType}
                summaryData={summaryData}
                summaryLoading={summaryLoading}
                summaryError={summaryError}
                onSelectSummary={handleSelectSummary}
                onClearSummary={handleClearSummary}
                extractionParam={extractionParam}
                extractionLoadingType={extractionLoadingType}
                extractionError={extractionError}
                activeExtraction={activeExtraction}
                onSelectExtraction={handleSelectExtraction}
                onClearExtraction={handleClearExtraction}
                transcriptId={String(transcriptData.transcript_id)}
                qaHistory={qaHistory}
                onAskQuestion={handleAskQuestion}
                onClearQAHistory={handleClearQAHistory}
                qaLoading={qaLoading}
                qaBootstrapping={qaBootstrapping}
                qaError={qaError}
              />
            </TabsContent>

            <TabsContent value="search" className="mt-6">
              <SearchTab
                transcript={transcriptData.transcript}
                currentTime={currentVideoTime}
                onSeek={handleSeek}
                searchValue={searchValue}
                onSearchValueChange={setSearchValue}
                queryParam={queryParam}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
              />
            </TabsContent>

            <TabsContent value="export" className="mt-6">
              <ExportTab />
            </TabsContent>
          </Tabs>
        ) : null}
      </main>
    </div>
  );
}
