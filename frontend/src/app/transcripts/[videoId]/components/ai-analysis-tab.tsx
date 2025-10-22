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
    <Tabs
      value={activeAITab}
      onValueChange={(value) => onAITabChange(value as AITab)}
    >
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="summary">Summarize</TabsTrigger>
        <TabsTrigger value="extract">Extract</TabsTrigger>
        <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-4">
        <Card>
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
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    onClick={() => onSelectSummary(option.value)}
                    className={cn(
                      "h-auto w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left overflow-hidden",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background text-foreground hover:border-primary/60 hover:bg-muted/40"
                    )}
                  >
                    <span className="text-sm font-semibold capitalize truncate w-full">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {option.description}
                    </span>
                  </Button>
                );
              })}
            </div>

            {summaryType ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {summaryLoading
                    ? "Generating summary..."
                    : "Summary ready. You can clear the selection to reset."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClearSummary}
                  disabled={summaryLoading}
                >
                  Clear summary
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a summary type above to generate an AI summary.
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

      <TabsContent value="extract" className="mt-4">
        <Card>
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
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    onClick={() => onSelectExtraction(option.value)}
                    className={cn(
                      "h-auto w-full flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left overflow-hidden",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background text-foreground hover:border-primary/60 hover:bg-muted/40"
                    )}
                  >
                    <span className="text-sm font-semibold capitalize truncate w-full">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {option.description}
                    </span>
                  </Button>
                );
              })}
            </div>

            {extractionParam ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {extractionLoadingType
                    ? extractionLoadingText[extractionLoadingType]
                    : "Extraction ready. Clear the selection to choose another type."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClearExtraction}
                  disabled={Boolean(extractionLoadingType)}
                >
                  Clear extraction
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose an extraction type above to analyse the transcript.
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

      <TabsContent value="qa" className="mt-4">
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
    </Tabs>
  );
}
