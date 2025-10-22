import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Database, Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "About - TranscriptAI by Conn.Digital",
  description:
    "Learn about our mission to make YouTube content more accessible and analyzable with AI-powered tools. Built by Conn.Digital.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          About Us
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Making YouTube Content More Accessible
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          We're building tools to help you extract maximum value from YouTube
          videos through AI-powered transcript analysis.
        </p>
      </div>

      {/* Mission Statement */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            YouTube is an incredible source of knowledge, tutorials, and
            insights. However, consuming video content isn't always the most
            efficient way to learn or reference information. That's where we
            come in.
          </p>
          <p>
            TranscriptAI was created to bridge the gap between video content and
            text-based learning. We believe that everyone should be able to:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Search through video content as easily as searching text</li>
            <li>Extract key insights without watching entire videos</li>
            <li>Reference specific moments with precise timestamps</li>
            <li>Analyze and summarize content using AI</li>
            <li>Make video content accessible to those who prefer reading</li>
          </ul>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <div className="mb-12">
        <h2 className="mb-6 text-center text-3xl font-bold">
          Built With Modern Technology
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Code className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Next.js 15 & React 19</CardTitle>
              <CardDescription>
                Modern frontend framework with server-side rendering for fast,
                SEO-friendly pages
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <Database className="h-6 w-6 text-cyan-500" />
              </div>
              <CardTitle>Go Backend & PostgreSQL</CardTitle>
              <CardDescription>
                High-performance backend API with reliable database storage for
                transcripts and analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle>Advanced AI Models</CardTitle>
              <CardDescription>
                Integration with OpenAI GPT, Google Gemini, and Anthropic Claude
                for intelligent analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Privacy-Focused</CardTitle>
              <CardDescription>
                No user tracking, no data selling. Your searches and analysis
                remain private
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Beta Program */}
      <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-background">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Beta Program
          </Badge>
          <CardTitle className="text-2xl">Join Our Beta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            We're currently in beta and offering all features completely free.
            This is your chance to help shape the future of the product!
          </p>
          <p>
            <strong className="text-foreground">
              As a beta user, you'll enjoy:
            </strong>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Unlimited transcript downloads</li>
            <li>Full access to all AI features</li>
            <li>No credit card or sign-up required</li>
            <li>Direct input into feature development</li>
            <li>Special benefits when we launch publicly</li>
          </ul>
          <p>
            Your feedback is invaluable. If you encounter any issues or have
            suggestions, please let us know!
          </p>
        </CardContent>
      </Card>

      {/* Future Vision */}
      <div className="mt-12 text-center">
        <h2 className="mb-4 text-2xl font-bold">What's Next?</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          We're constantly improving and adding new features. Upcoming additions
          include team collaboration, advanced export formats, custom AI
          prompts, and integrations with popular note-taking apps. Stay tuned!
        </p>
      </div>
    </div>
  );
}
