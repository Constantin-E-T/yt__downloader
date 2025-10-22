"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TranscriptMeta } from "@/components/transcript-table";
import { YouTubePlayer } from "@/components/youtube-player";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TranscriptTab } from "./components/transcript-tab";
import { AIAnalysisTab } from "./components/ai-analysis-tab";
import { SearchTab } from "./components/search-tab";
import { ExportTab } from "./components/export-tab";
import {
  useSearchParamsManager,
  useTranscriptData,
  useVideoPlayer,
  useTabNavigation,
  useAIFeatures,
  useSearch,
} from "./hooks";

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

const isTabKey = (
  value: string | undefined
): value is "transcript" | "ai" | "search" | "export" =>
  value === "transcript" ||
  value === "ai" ||
  value === "search" ||
  value === "export";

const isAITabKey = (
  value: string | undefined
): value is "summary" | "extract" | "qa" =>
  value === "summary" || value === "extract" || value === "qa";

export default function TranscriptPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = useMemo(() => normaliseParam(params?.videoId), [params]);

  // Search params management
  const { searchParams, updateSearchParams } = useSearchParamsManager();

  // Parse URL params (memoized to prevent infinite loops)
  const transcriptParam = useMemo(
    () => searchParams.get("transcript") || undefined,
    [searchParams]
  );
  const languageParam = useMemo(
    () => searchParams.get("language") || undefined,
    [searchParams]
  );

  const tabParams = useMemo(
    () => ({
      tabParam: searchParams.get("tab"),
      aiTabParam: searchParams.get("aiTab"),
      summaryParam: searchParams.get("summary"),
      extractionParam: searchParams.get("extract"),
      qaParams: searchParams.getAll("qa"),
      queryParam: searchParams.get("query") || undefined,
    }),
    [searchParams]
  );

  // Tab navigation
  const {
    activeTab,
    setActiveTab,
    activeAITab,
    setActiveAITab,
    summaryParam,
    extractionParam,
    qaParams,
    queryParam,
    searchValue,
    setSearchValue,
  } = useTabNavigation(tabParams, updateSearchParams);

  // Transcript data
  const {
    transcriptData,
    transcriptLoading,
    transcriptError,
    transcriptId,
    transcriptVideoId,
  } = useTranscriptData({
    videoId,
    transcriptParam,
    languageParam,
    updateSearchParams,
  });

  // Video player
  const { playerRef, currentVideoTime, setCurrentVideoTime, handleSeek } =
    useVideoPlayer();

  // AI features
  const aiFeatures = useAIFeatures({
    transcriptId,
    summaryParam,
    extractionParam,
    qaParams,
    setActiveTab,
    setActiveAITab,
    updateSearchParams,
  });

  // Search
  const { handleSearchSubmit, handleClearSearch } = useSearch(
    searchValue,
    setSearchValue,
    updateSearchParams
  );

  // Computed values
  const shareUrl = useMemo(() => {
    const id = transcriptVideoId ?? videoId;
    return id ? `https://youtube.com/watch?v=${id}` : undefined;
  }, [transcriptVideoId, videoId]);

  const resolvedVideoId = transcriptData?.video_id ?? videoId ?? null;
  const transcriptReady = Boolean(transcriptData) && !transcriptError;

  // Render
  return (
    <div className="fixed inset-0 top-16 flex flex-col overflow-hidden bg-background">
      <div className="mx-auto flex h-full w-full max-w-7xl gap-6 px-4 py-6 lg:flex-row lg:flex-nowrap">
        {/* Sidebar */}
        <aside className="hidden w-[400px] shrink-0 lg:block">
          <div className="flex h-full flex-col gap-4 overflow-y-auto">
            {/* Video Player Card */}
            <Card className="shrink-0">
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
                      onTimeUpdate={setCurrentVideoTime}
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

            {/* Metadata Card */}
            <Card className="shrink-0">
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
                        {transcriptData.transcript.length.toLocaleString()}{" "}
                        lines
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

        {/* Main Content */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header Section - Fixed, no scroll */}
          <div className="shrink-0 space-y-4 pb-6">
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

          {/* Error State */}
          {transcriptError ? (
            <Card className="shrink-0 border-destructive/50 bg-destructive/10">
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

          {/* Loading State */}
          {transcriptLoading && !transcriptData ? (
            <Card className="shrink-0 border-dashed">
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-[440px] w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : null}

          {/* Content Tabs - This section should scroll */}
          {transcriptReady && transcriptData ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {/* Tab Navigation - Fixed */}
                <TabsList className="mb-6 grid w-full shrink-0 grid-cols-4">
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

                {/* Scrollable Content Container */}
                <div className="min-h-0 flex-1 overflow-hidden">
                  {/* Transcript Tab */}
                  <TabsContent
                    value="transcript"
                    className="m-0 h-full overflow-y-auto p-0"
                  >
                    <TranscriptTab
                      transcript={transcriptData.transcript}
                      currentTime={currentVideoTime}
                      onSeek={handleSeek}
                    />
                  </TabsContent>

                  {/* AI Analysis Tab */}
                  <TabsContent
                    value="ai"
                    className="m-0 h-full overflow-y-auto p-0"
                  >
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
                      summaryType={summaryParam}
                      summaryData={aiFeatures.summaryData}
                      summaryLoading={aiFeatures.summaryLoading}
                      summaryError={aiFeatures.summaryError}
                      onSelectSummary={aiFeatures.handleSelectSummary}
                      onClearSummary={aiFeatures.handleClearSummary}
                      extractionParam={extractionParam}
                      extractionLoadingType={aiFeatures.extractionLoadingType}
                      extractionError={aiFeatures.extractionError}
                      activeExtraction={aiFeatures.activeExtraction}
                      onSelectExtraction={aiFeatures.handleSelectExtraction}
                      onClearExtraction={aiFeatures.handleClearExtraction}
                      transcriptId={String(transcriptData.transcript_id)}
                      qaHistory={aiFeatures.qaHistory}
                      onAskQuestion={aiFeatures.handleAskQuestion}
                      onClearQAHistory={aiFeatures.handleClearQAHistory}
                      qaLoading={aiFeatures.qaLoading}
                      qaBootstrapping={aiFeatures.qaBootstrapping}
                      qaError={aiFeatures.qaError}
                    />
                  </TabsContent>

                  {/* Search Tab */}
                  <TabsContent
                    value="search"
                    className="m-0 h-full overflow-y-auto p-0"
                  >
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

                  {/* Export Tab */}
                  <TabsContent
                    value="export"
                    className="m-0 h-full overflow-y-auto p-0"
                  >
                    <ExportTab />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
