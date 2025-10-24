"use client";

import {
  Sparkles,
  Link2,
  FileText,
  Brain,
  Download,
  Code,
  Quote,
  CheckSquare,
  Zap,
  Rocket,
} from "lucide-react";

export interface SlideProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function WelcomeSlide() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
      {/* Logo/Icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to TranscriptAI
        </h2>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Transform YouTube videos into actionable insights with AI-powered
          analysis
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm">
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-medium">Completely Free</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="font-medium">No Sign-up</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="font-medium">AI-Powered</span>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSlide() {
  const steps = [
    {
      icon: Link2,
      title: "Paste YouTube URL",
      description: "Copy and paste any YouTube video link",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileText,
      title: "Get Transcript Instantly",
      description: "Download the full transcript in seconds",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Brain,
      title: "Analyze with AI",
      description: "Generate summaries, extract insights, and more",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6 py-6">
      {/* Headline */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Get Started in 3 Simple Steps
        </h2>
        <p className="text-muted-foreground">
          No complicated setup, just paste and analyze
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 pt-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border-2 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              {/* Step Number & Icon */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${step.color} shadow-md`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  STEP {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeaturesSlide() {
  const features = [
    {
      icon: Brain,
      title: "AI Summaries & Q&A",
      description: "Get instant summaries and ask questions",
      color: "text-purple-500",
    },
    {
      icon: Code,
      title: "Code Extraction",
      description: "Extract code snippets automatically",
      color: "text-blue-500",
    },
    {
      icon: Quote,
      title: "Key Quotes",
      description: "Pull out important quotes",
      color: "text-amber-500",
    },
    {
      icon: CheckSquare,
      title: "Action Items",
      description: "Identify actionable tasks",
      color: "text-green-500",
    },
    {
      icon: Download,
      title: "Export Formats",
      description: "Download in TXT, JSON, MD, CSV",
      color: "text-red-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant results, no waiting",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6 py-6">
      {/* Headline */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Powerful Features, Completely Free
        </h2>
        <p className="text-muted-foreground">
          Everything you need to analyze YouTube content
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CallToActionSlide() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
      {/* Rocket Icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-linear-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-blue-500 shadow-lg">
          <Rocket className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Get Started?
        </h2>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Paste your first YouTube URL below and experience the power of
          AI-driven transcript analysis
        </p>
      </div>

      {/* Features Preview */}
      <div className="grid gap-3 pt-4 sm:grid-cols-3">
        <div className="rounded-lg bg-muted p-3">
          <FileText className="mx-auto mb-2 h-5 w-5 text-blue-500" />
          <p className="text-xs font-medium">Instant Transcripts</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Brain className="mx-auto mb-2 h-5 w-5 text-purple-500" />
          <p className="text-xs font-medium">AI Analysis</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Download className="mx-auto mb-2 h-5 w-5 text-green-500" />
          <p className="text-xs font-medium">Easy Export</p>
        </div>
      </div>

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground">
        Join thousands of users transforming how they consume video content
      </p>
    </div>
  );
}
