import { Fragment } from "react";

import type { TranscriptLine } from "@/lib/api/transcripts";

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

export function TranscriptTable({
  transcript,
  query,
}: {
  transcript: TranscriptLine[];
  query?: string;
}) {
  const lines =
    query && query.length > 0
      ? transcript.filter((line) => line.text.toLowerCase().includes(query.toLowerCase()))
      : transcript;

  if (query && lines.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        No transcript lines matched &ldquo;{query}&rdquo;. Try a different keyword.
      </div>
    );
  }

  return (
    <div className="max-h-[520px] overflow-y-auto rounded-lg border border-border">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="w-24 px-4 py-3">Start</th>
            <th className="w-24 px-4 py-3">Duration</th>
            <th className="px-4 py-3">Text</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr
              key={`${line.start}-${index}`}
              className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
            >
              <td className="px-4 py-3 font-mono text-xs">{formatTimestamp(line.start)}</td>
              <td className="px-4 py-3 font-mono text-xs">{formatDuration(line.duration)}</td>
              <td className="px-4 py-3 text-sm text-foreground">{highlightText(line.text, query)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
