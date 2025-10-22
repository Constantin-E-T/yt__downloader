'use client';

import { Fragment, memo, useEffect, useMemo, useRef } from "react";

import type { TranscriptLine } from "@/lib/api/transcripts";
import { cn } from "@/lib/utils";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query?: string) {
  if (!query) return text;
  const escaped = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const target = query.toLowerCase();

  return parts.map((part, index) => {
    if (part.toLowerCase() === target) {
      return (
        <mark key={`${part}-${index}`} className="rounded-sm bg-primary/20 px-1 py-0.5">
          {part}
        </mark>
      );
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const minuteSegment = String(minutes).padStart(2, "0");
  const secondSegment = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${minuteSegment}:${secondSegment}`;
  }

  return `${minuteSegment}:${secondSegment}`;
}

function formatTimestamp(ms: number): string {
  return formatDuration(ms);
}

type TranscriptTableProps = {
  transcript: TranscriptLine[];
  query?: string;
  currentTime?: number;
  onSeek?: (seconds: number) => void;
  containerClassName?: string;
  disableInternalScroll?: boolean;
};

export function TranscriptMeta({ transcript }: { transcript: TranscriptLine[] }) {
  if (transcript.length === 0) {
    return null;
  }

  const lastLine = transcript[transcript.length - 1];
  const coverageMs = lastLine.start + lastLine.duration;

  return (
    <p className="text-xs text-muted-foreground">
      Transcript lines:{" "}
      <span className="font-medium text-foreground">{transcript.length.toLocaleString()}</span>
      <span className="mx-1 text-foreground/30">•</span>
      Approximate coverage:{" "}
      <span className="font-medium text-foreground">{formatDuration(coverageMs)}</span>{" "}
      (computed from final line). Compare with the YouTube runtime to confirm completeness.
    </p>
  );
}

function TranscriptTableComponent({
  transcript,
  query,
  currentTime,
  onSeek,
  containerClassName,
  disableInternalScroll = false,
}: TranscriptTableProps) {
  const currentSeconds = typeof currentTime === "number" ? currentTime : null;
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);
  const lastActiveStartRef = useRef<number | null>(null);

  const lines = useMemo(() => {
    const normalizedQuery = query?.trim().toLowerCase();
    if (!normalizedQuery) {
      return transcript;
    }
    return transcript.filter((line) => line.text.toLowerCase().includes(normalizedQuery));
  }, [query, transcript]);

  const noResults = Boolean(query && lines.length === 0);

  useEffect(() => {
    if (lines.length === 0) {
      activeRowRef.current = null;
      lastActiveStartRef.current = null;
      return;
    }

    const activeRow = activeRowRef.current;
    if (!activeRow) return;

    const startAttribute = activeRow.getAttribute("data-start-seconds");
    const startValue = startAttribute ? Number(startAttribute) : null;

    if (startValue === null || Number.isNaN(startValue)) {
      return;
    }

    if (lastActiveStartRef.current === startValue) {
      return;
    }

    lastActiveStartRef.current = startValue;

    activeRow.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentSeconds, lines.length]);

  if (noResults) {
    return (
      <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        No transcript lines matched &ldquo;{query}&rdquo;. Try a different keyword.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        disableInternalScroll ? "" : "max-h-[520px] overflow-y-auto",
        containerClassName,
      )}
    >
      <table className="w-full table-fixed border-collapse text-left text-sm" aria-live="polite">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="w-24 px-4 py-3">Start</th>
            <th className="w-24 px-4 py-3">Duration</th>
            <th className="px-4 py-3">Text</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const startSeconds = line.start / 1000;
            const endSeconds = (line.start + line.duration) / 1000;
            const isActiveRow =
              currentSeconds !== null &&
              currentSeconds >= startSeconds &&
              currentSeconds < endSeconds;

            const rowClassName = cn(
              "border-b border-border/40 transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-ring/60",
              isActiveRow
                ? "bg-primary/20 border-l-4 border-l-primary font-medium"
                : index % 2 === 0
                ? "bg-background hover:bg-muted/40"
                : "bg-muted/30 hover:bg-muted/50",
            );

            const handleSeek = () => {
              onSeek?.(startSeconds);
            };

            return (
              <tr
                key={`${line.start}-${index}`}
                ref={isActiveRow ? activeRowRef : null}
                data-start-seconds={startSeconds}
                className={cn(rowClassName, "cursor-pointer")}
                onClick={handleSeek}
                tabIndex={0}
                aria-current={isActiveRow ? "true" : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSeek();
                  }
                }}
              >
                <td className="px-4 py-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSeek();
                    }}
                    className="rounded px-1 py-0.5 font-mono text-xs hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-ring/60"
                  >
                    {formatTimestamp(line.start)}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{formatDuration(line.duration)}</td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {highlightText(line.text, query)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const TranscriptTable = memo(TranscriptTableComponent);
TranscriptTable.displayName = "TranscriptTable";
