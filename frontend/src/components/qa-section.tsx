'use client';

import { FormEvent, useMemo, useState } from "react";

import type { QAResponse } from "@/lib/api/qa";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 500;

const CONFIDENCE_STYLES: Record<QAResponse["confidence"], string> = {
  high: "border-transparent bg-emerald-500/15 text-emerald-700",
  medium: "border-transparent bg-amber-500/20 text-amber-700",
  low: "border-transparent bg-orange-500/20 text-orange-700",
  not_found: "border-transparent bg-slate-500/20 text-slate-700",
};

function QACard({ qa }: { qa: QAResponse }) {
  const confidenceLabel = useMemo(
    () => qa.confidence.replace("_", " "),
    [qa.confidence]
  );
  const confidenceClass = useMemo(
    () => CONFIDENCE_STYLES[qa.confidence] ?? CONFIDENCE_STYLES.not_found,
    [qa.confidence]
  );
  const timestamp = new Date(qa.created_at);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Q: {qa.question}</p>
        <Badge variant="outline" className={cn("capitalize", confidenceClass)}>
          {confidenceLabel}
        </Badge>
      </div>

      <div className="rounded-lg bg-primary/5 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{qa.answer}</p>
      </div>

      {qa.sources.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Sources
          </p>
          {qa.sources.map((source, index) => (
            <blockquote
              key={`${source.quote}-${index}`}
              className="border-l-2 border-primary/50 pl-3 text-sm text-muted-foreground"
            >
              “{source.quote}”
              {source.timestamp ? (
                <span className="ml-2 text-xs text-foreground/60">
                  ({source.timestamp})
                </span>
              ) : null}
            </blockquote>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Model: {qa.model}</span>
        <span>•</span>
        <span>Tokens: {qa.tokens_used.toLocaleString()}</span>
        <span>•</span>
        <span>{timestamp.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function QASection({
  transcriptId,
  qaHistory,
  onAskQuestion,
  onClearHistory,
  loading,
  bootstrapping,
  error,
}: {
  transcriptId?: string;
  qaHistory: QAResponse[];
  onAskQuestion: (question: string) => Promise<void>;
  onClearHistory: () => void;
  loading: boolean;
  bootstrapping: boolean;
  error?: string | null;
}) {
  const [question, setQuestion] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();

    if (trimmed.length < MIN_QUESTION_LENGTH) {
      setLocalError("Please enter at least 3 characters.");
      return;
    }

    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setLocalError("Questions cannot exceed 500 characters.");
      return;
    }

    if (!transcriptId) {
      setLocalError("Transcript not ready yet. Please wait.");
      return;
    }

    setLocalError(null);

    try {
      await onAskQuestion(trimmed);
      setQuestion("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to process the question.";
      setLocalError(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask Questions</CardTitle>
        <CardDescription>
          Ask questions about the transcript content. The AI responds using only the transcript and cites supporting snippets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            id="question"
            name="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What is the main topic discussed in this video?"
            className="w-full min-h-[120px] rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            minLength={MIN_QUESTION_LENGTH}
            maxLength={MAX_QUESTION_LENGTH}
            disabled={loading || bootstrapping || !transcriptId}
            aria-label="Question about transcript"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {question.length}/{MAX_QUESTION_LENGTH} characters
            </span>
            <div className="flex items-center gap-2">
              {qaHistory.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearHistory}
                  disabled={loading || bootstrapping}
                >
                  Clear history
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                disabled={
                  loading ||
                  bootstrapping ||
                  question.trim().length < MIN_QUESTION_LENGTH ||
                  question.trim().length > MAX_QUESTION_LENGTH ||
                  !transcriptId
                }
              >
                {loading ? "Thinking..." : "Ask question"}
              </Button>
            </div>
          </div>
        </form>

        {localError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {localError}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {bootstrapping ? (
          <LoadingSpinner text="Restoring previous questions..." />
        ) : null}

        {!bootstrapping && qaHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions asked yet. Submit a question above to get started.
          </p>
        ) : null}

        {qaHistory.length > 0 ? (
          <div className="space-y-3">
            {qaHistory.map((qa) => (
              <QACard key={qa.id} qa={qa} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
