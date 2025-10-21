'use client';

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";

import type { QAResponse } from "@/lib/api/qa";
import { LoadingSpinner } from "@/components/loading-spinner";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 500;

function QACard({ qa }: { qa: QAResponse }) {
  const confidenceClass = useMemo(() => {
    switch (qa.confidence) {
    case "high":
      return "bg-green-500/20 text-green-700";
    case "medium":
      return "bg-yellow-500/20 text-yellow-700";
    case "low":
      return "bg-orange-500/20 text-orange-700";
    case "not_found":
    default:
      return "bg-gray-500/20 text-gray-700";
    }
  }, [qa.confidence]);

  const timestamp = new Date(qa.created_at);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Q: {qa.question}
        </p>
        <span className={clsx("text-xs px-2 py-1 rounded capitalize", confidenceClass)}>
          {qa.confidence.replace("_", " ")}
        </span>
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
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Ask Questions</h2>
        <p className="text-sm text-muted-foreground">
          Ask questions about the transcript content. The AI responds using only the transcript and cites supporting snippets.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What is the main topic discussed in this video?"
          className="w-full min-h-[120px] rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          minLength={MIN_QUESTION_LENGTH}
          maxLength={MAX_QUESTION_LENGTH}
          disabled={loading || bootstrapping || !transcriptId}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {question.length}/{MAX_QUESTION_LENGTH} characters
          </span>
          <div className="flex items-center gap-2">
            {qaHistory.length > 0 ? (
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/50"
                disabled={loading || bootstrapping}
              >
                Clear history
              </button>
            ) : null}
            <button
              type="submit"
              disabled={
                loading ||
                bootstrapping ||
                question.trim().length < MIN_QUESTION_LENGTH ||
                question.trim().length > MAX_QUESTION_LENGTH ||
                !transcriptId
              }
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {loading ? "Thinking..." : "Ask question"}
            </button>
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

      {qaHistory.map((qa) => (
        <QACard key={qa.id} qa={qa} />
      ))}
    </section>
  );
}

