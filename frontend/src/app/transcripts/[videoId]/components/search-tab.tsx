import { FormEvent } from "react";
import { TranscriptTable } from "@/components/transcript-table";
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
    <div className="flex h-full flex-col gap-4">
      {/* Sticky Search Form with Better Styling */}
      <Card className="shrink-0 shadow-sm transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔍</span> Search Transcript
          </CardTitle>
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
            <div className="flex-1 space-y-2">
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
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring"
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
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-sm text-muted-foreground">
                Showing results containing{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{queryParam}&rdquo;
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the search field above to filter transcript lines and
              highlight matching phrases.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scrollable Results with Better Styling */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="p-4">
          <TranscriptTable
            transcript={transcript}
            query={queryParam}
            currentTime={currentTime}
            onSeek={onSeek}
            disableInternalScroll
          />
        </div>
      </div>
    </div>
  );
}
