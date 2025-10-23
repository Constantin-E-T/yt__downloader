"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Download, FileJson, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestTranscriptExport, type ExportFormat } from "@/lib/api/transcripts";

type ExportTabProps = {
  transcriptId: string | undefined;
  transcriptTitle: string | undefined;
  videoUrl: string | undefined;
  language: string | undefined;
  segmentCount: number | undefined;
  isReady: boolean;
  isLoading: boolean;
};

const formatLabels: Record<ExportFormat, string> = {
  json: "JSON (.json)",
  text: "Plain Text (.txt)",
};

const formatDescriptions: Record<ExportFormat, string> = {
  json: "Includes metadata, timestamps, and transcript segments. Ideal for automation or integrations.",
  text: "Readable plain text with timestamps for each line. Perfect for notes or sharing snippets.",
};

const formatIcons: Record<ExportFormat, ComponentType<{ className?: string }>> = {
  json: FileJson,
  text: FileText,
};

export function ExportTab({
  transcriptId,
  transcriptTitle,
  videoUrl,
  language,
  segmentCount,
  isReady,
  isLoading,
}: ExportTabProps) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const metadataSummary = useMemo(() => {
    if (!transcriptTitle && !language && !segmentCount) {
      return null;
    }
    const parts: string[] = [];
    if (language) {
      parts.push(`Language: ${language.toUpperCase()}`);
    }
    if (segmentCount && segmentCount > 0) {
      parts.push(`${segmentCount.toLocaleString()} segments`);
    }
    return parts.join(" • ");
  }, [language, segmentCount, transcriptTitle]);

  const handleDownload = useCallback(
    async (format: ExportFormat) => {
      if (!transcriptId) {
        setErrorMessage("Transcript is not available yet. Generate it first.");
        return;
      }
      try {
        setDownloading(format);
        setErrorMessage(null);
        setSuccessMessage(null);

        const { blob, filename, error } = await requestTranscriptExport({
          transcriptId,
          format,
        });

        if (error) {
          setErrorMessage(error);
          return;
        }

        if (!blob) {
          setErrorMessage("Download failed: empty response from server.");
          return;
        }

        const fallbackName = `transcript-${transcriptId}.${format === "json" ? "json" : "txt"}`;
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename ?? fallbackName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);

        setSuccessMessage(`${format === "json" ? "JSON" : "Plain text"} export started—check your downloads.`);
      } catch (error) {
        const message =
          error instanceof Error
            ? `Failed to download transcript: ${error.message}`
            : "Failed to download transcript due to an unexpected error.";
        setErrorMessage(message);
      } finally {
        setDownloading(null);
      }
    },
    [transcriptId]
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <p className="text-sm text-muted-foreground">
          Preparing transcript data… Export options will unlock once the transcript is ready.
        </p>
      );
    }

    if (!isReady || !transcriptId) {
      return (
        <p className="text-sm text-muted-foreground">
          Generate or load a transcript first to enable export options.
        </p>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{transcriptTitle ?? "Transcript ready"}</p>
              {metadataSummary ? (
                <p className="text-xs text-muted-foreground/80">{metadataSummary}</p>
              ) : null}
              {videoUrl ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Source:{" "}
                  <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
                    {videoUrl}
                  </a>
                </p>
              ) : null}
            </div>
            <Badge variant="secondary">Ready</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(formatLabels) as ExportFormat[]).map((format) => {
            const Icon = formatIcons[format];
            return (
              <div
                key={format}
                className="flex h-full flex-col justify-between gap-3 rounded-lg border border-border bg-card/60 p-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    <p className="font-semibold text-foreground">{formatLabels[format]}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {formatDescriptions[format]}
                  </p>
                </div>
                <Button
                  onClick={() => handleDownload(format)}
                  disabled={downloading !== null}
                  variant="outline"
                  className="w-full"
                >
                  {downloading === format ? (
                    "Preparing download…"
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" aria-hidden />
                      Download
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Transcript</CardTitle>
        <CardDescription>Download your transcript for external workflows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderBody()}
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : successMessage ? (
          <p className="text-sm text-muted-foreground">{successMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
