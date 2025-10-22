"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
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
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-background shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            <div className="mb-8 flex justify-center">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>

            <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to Get Started?
            </h2>

            <p className="mb-8 text-center text-lg text-muted-foreground">
              Paste any YouTube URL below and start analyzing videos in seconds.
              No sign-up required.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-12 flex-1 border-2 text-base"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 gap-2 px-8"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Try It Now"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Free during beta • No credit card required • Process unlimited
              videos
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
