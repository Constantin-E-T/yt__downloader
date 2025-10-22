import type { ExtractionType } from "@/lib/api/extractions";
import type { SummaryResponse } from "@/lib/api/summaries";
import type { ExtractionResponse } from "@/lib/api/extractions";
import type { QAResponse } from "@/lib/api/qa";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ExtractionPanel } from "@/components/extraction-panel";
import { QASection } from "@/components/qa-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SummaryPanel } from "./summary-panel";
import {
  SUMMARY_OPTIONS,
  EXTRACTION_OPTIONS,
  extractionLoadingText,
} from "../constants";
import type { SummaryType, AITab } from "../types";

interface AIAnalysisTabProps {
  // AI Tab state
  activeAITab: AITab;
  onAITabChange: (tab: AITab) => void;

  // Summary state
  summaryType: SummaryType | undefined;
  summaryData: SummaryResponse | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onSelectSummary: (type: SummaryType) => void;
  onClearSummary: () => void;

  // Extraction state
  extractionParam: ExtractionType | undefined;
  extractionLoadingType: ExtractionType | null;
  extractionError: string | null;
  activeExtraction: ExtractionResponse | null;
  onSelectExtraction: (type: ExtractionType) => void;
  onClearExtraction: () => void;

  // Q&A state
  transcriptId: string;
  qaHistory: QAResponse[];
  onAskQuestion: (question: string) => Promise<void>;
  onClearQAHistory: () => void;
  qaLoading: boolean;
  qaBootstrapping: boolean;
  qaError: string | null;
}

export function AIAnalysisTab({
  activeAITab,
  onAITabChange,
  summaryType,
  summaryData,
  summaryLoading,
  summaryError,
  onSelectSummary,
  onClearSummary,
  extractionParam,
  extractionLoadingType,
  extractionError,
  activeExtraction,
  onSelectExtraction,
  onClearExtraction,
  transcriptId,
  qaHistory,
  onAskQuestion,
  onClearQAHistory,
  qaLoading,
  qaBootstrapping,
  qaError,
}: AIAnalysisTabProps) {
  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={activeAITab}
        onValueChange={(value) => onAITabChange(value as AITab)}
        className="flex h-full flex-col"
      >
        {/* Sticky Secondary Tabs with Shadow */}
        <div className="sticky top-0 z-10 -mx-1 shrink-0 border-b bg-background/95 px-1 pb-4 pt-1 backdrop-blur supports-backdrop-filter:bg-background/80">
          <TabsList className="grid w-full grid-cols-3 gap-2">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">✨ Summarize</span>
              <span className="sm:hidden">✨</span>
            </TabsTrigger>
            <TabsTrigger
              value="extract"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">🔍 Extract</span>
              <span className="sm:hidden">🔍</span>
            </TabsTrigger>
            <TabsTrigger
              value="qa"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">💬 Q&amp;A</span>
              <span className="sm:hidden">💬</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable Content with Padding */}
        <div className="min-h-0 flex-1 overflow-y-auto pt-6">
          <TabsContent
            value="summary"
            className="m-0 focus-visible:outline-none"
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
                <CardDescription>
                  Generate cached summaries via the backend AI service. Repeat
                  requests reuse cached results for faster responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {SUMMARY_OPTIONS.map((option) => {
                    const isActive = summaryType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelectSummary(option.value)}
                        className={cn(
                          "relative h-auto w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all",
                          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/60 hover:bg-accent/50"
                        )}
                      >
                        {/* Radio indicator */}
                        <div className="mb-2 flex items-center justify-between w-full">
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                              isActive
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isActive && (
                              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-sm font-semibold capitalize truncate w-full",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {summaryType ? (
                  <div className="rounded-md bg-muted/50 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {summaryLoading
                          ? "Generating summary..."
                          : "Summary ready. Click another option to switch or clear to reset."}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClearSummary}
                        disabled={summaryLoading}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Choose one summary type to generate an AI summary.
                  </p>
                )}

                {summaryError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {summaryError}
                  </div>
                ) : null}

                {summaryLoading ? (
                  <LoadingSpinner text="Generating summary..." />
                ) : null}

                {!summaryLoading && summaryType && summaryData ? (
                  <SummaryPanel summary={summaryData} />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="extract"
            className="m-0 focus-visible:outline-none"
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Content Extraction</CardTitle>
                <CardDescription>
                  Identify code snippets, key quotes, or actionable next steps
                  sourced from the transcript.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {EXTRACTION_OPTIONS.map((option) => {
                    const isActive = extractionParam === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelectExtraction(option.value)}
                        className={cn(
                          "relative h-auto w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-all",
                          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/60 hover:bg-accent/50"
                        )}
                      >
                        {/* Radio indicator */}
                        <div className="mb-2 flex items-center justify-between w-full">
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                              isActive
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isActive && (
                              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-sm font-semibold capitalize truncate w-full",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {extractionParam ? (
                  <div className="rounded-md bg-muted/50 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {extractionLoadingType
                          ? extractionLoadingText[extractionLoadingType]
                          : "Extraction ready. Click another option to switch or clear to reset."}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClearExtraction}
                        disabled={Boolean(extractionLoadingType)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Choose one extraction type to analyse the transcript.
                  </p>
                )}

                {extractionError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {extractionError}
                  </div>
                ) : null}

                {extractionLoadingType ? (
                  <LoadingSpinner
                    text={extractionLoadingText[extractionLoadingType]}
                  />
                ) : null}

                {!extractionLoadingType && activeExtraction ? (
                  <ExtractionPanel data={activeExtraction} />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa" className="m-0 focus-visible:outline-none">
            <QASection
              transcriptId={transcriptId}
              qaHistory={qaHistory}
              onAskQuestion={onAskQuestion}
              onClearHistory={onClearQAHistory}
              loading={qaLoading}
              bootstrapping={qaBootstrapping}
              error={qaError}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
