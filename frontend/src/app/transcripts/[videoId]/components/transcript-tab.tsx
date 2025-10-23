import { TranscriptTable } from "@/components/transcript-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TranscriptResponse } from "@/lib/api/transcripts";

interface TranscriptTabProps {
  transcript: TranscriptResponse["transcript"];
  currentTime: number;
  onSeek: (time: number) => void;
}

export function TranscriptTab({
  transcript,
  currentTime,
  onSeek,
}: TranscriptTabProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Sticky Header */}
      <Card className="shrink-0 shadow-sm transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📝</span> Full Transcript
          </CardTitle>
          <CardDescription>
            Click any timestamp to jump to that moment in the video.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Scrollable Transcript */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        <TranscriptTable
          transcript={transcript}
          currentTime={currentTime}
          onSeek={onSeek}
          disableInternalScroll
        />
      </div>
    </div>
  );
}
