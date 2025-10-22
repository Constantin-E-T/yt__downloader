import { TranscriptTable } from "@/components/transcript-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>Full Transcript</CardTitle>
        <CardDescription>
          Click any timestamp to jump to that moment in the video.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            <TranscriptTable
              transcript={transcript}
              currentTime={currentTime}
              onSeek={onSeek}
              disableInternalScroll
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
