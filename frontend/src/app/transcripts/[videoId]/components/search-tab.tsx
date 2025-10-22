import { FormEvent } from "react";
import { TranscriptTable } from "@/components/transcript-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TranscriptResponse } from "@/lib/api/transcripts";

interface SearchTabProps {
  transcript: TranscriptResponse["transcript"];
  currentTime: number;
  onSeek: (time: number) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  queryParam: string | undefined;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClearSearch: () => void;
}

export function SearchTab({
  transcript,
  currentTime,
  onSeek,
  searchValue,
  onSearchValueChange,
  queryParam,
  onSearchSubmit,
  onClearSearch,
}: SearchTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Transcript</CardTitle>
        <CardDescription>
          Filter transcript lines by keyword and jump straight to the moments
          that matter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={onSearchSubmit}
        >
          <div className="flex-1">
            <label
              htmlFor="query"
              className="text-sm font-medium text-foreground"
            >
              Search query
            </label>
            <input
              id="query"
              name="query"
              type="text"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Keyword or phrase"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 sm:flex-none">
              Apply search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClearSearch}
              className="flex-1 sm:flex-none"
            >
              Clear
            </Button>
          </div>
        </form>

        {queryParam ? (
          <p className="text-sm text-muted-foreground">
            Showing results containing{" "}
            <span className="font-medium text-foreground">
              &ldquo;{queryParam}&rdquo;
            </span>
            .
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Use the search field above to filter transcript lines and highlight
            matching phrases.
          </p>
        )}

        <ScrollArea className="h-[520px]">
          <div className="pr-4">
            <TranscriptTable
              transcript={transcript}
              query={queryParam}
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
