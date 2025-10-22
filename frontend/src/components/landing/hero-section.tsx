"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsLoading(true);

    // Extract video ID from URL
    const videoIdMatch = videoUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    const videoId = videoIdMatch?.[1];

    if (videoId) {
      router.push(`/transcripts/${videoId}`);
    } else {
      // Fallback to using the full URL
      const params = new URLSearchParams({ video: videoUrl });
      router.push(`/?${params.toString()}`);
    }
  };

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-background to-background" />

      <div className="mx-auto max-w-4xl text-center">
        {/* Beta Badge */}
        <div className="mb-6 flex justify-center">
          <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Free Beta Access
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Transform YouTube Videos into{" "}
          <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Actionable Insights
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mb-10 text-lg text-muted-foreground sm:text-xl md:text-2xl">
          Download transcripts instantly and analyze them with AI. Get
          summaries, extract code snippets, quotes, and action items from any
          YouTube video.
        </p>

        {/* CTA Form */}
        <form onSubmit={handleSubmit} className="mx-auto mb-6 max-w-2xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="url"
              placeholder="Paste YouTube URL here... (e.g., https://youtube.com/watch?v=...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="h-12 flex-1 text-base"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 gap-2 px-8"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get Transcript"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Completely Free During Beta</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>No Sign-up Required</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            <span>AI-Powered Analysis</span>
          </div>
        </div>
      </div>
    </section>
  );
}
