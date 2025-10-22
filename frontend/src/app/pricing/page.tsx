import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - YT Transcript Downloader",
  description:
    "Currently in free beta. All features available at no cost during our beta period.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Beta Pricing
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Free During Beta
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          All features are completely free while we're in beta. No credit card
          required, no limits.
        </p>
      </div>

      {/* Pricing Card */}
      <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-background shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Badge className="text-lg px-6 py-2">Beta Access</Badge>
          </div>
          <CardTitle className="text-4xl">$0</CardTitle>
          <CardDescription className="text-lg">
            Free forever during beta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Everything included:</h3>
            <ul className="space-y-3">
              {[
                "Unlimited transcript downloads",
                "AI-powered summaries (brief, detailed, key points)",
                "Smart content extraction (code, quotes, action items)",
                "Interactive Q&A with transcripts",
                "Full-text search across transcripts",
                "Timestamp-synced video player",
                "Export functionality (coming soon)",
                "No ads, no tracking",
                "Priority support during beta",
                "Early access to new features",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-semibold">What happens after beta?</h4>
            <p className="text-sm text-muted-foreground">
              We're committed to keeping core features free for individual
              users. When we eventually launch paid tiers, they'll focus on team
              collaboration, advanced integrations, and premium AI models. Beta
              users will receive special benefits and grandfathered pricing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="mt-12 space-y-6">
        <h2 className="text-center text-2xl font-bold">Common Questions</h2>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-2 font-semibold">
              Do I need to create an account?
            </h3>
            <p className="text-sm text-muted-foreground">
              No! Just paste a YouTube URL and start using the service
              immediately. No sign-up required.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-2 font-semibold">Are there any usage limits?</h3>
            <p className="text-sm text-muted-foreground">
              During beta, there are no hard limits. We may implement fair-use
              policies if we detect abuse, but normal usage is completely
              unlimited.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-2 font-semibold">When will beta end?</h3>
            <p className="text-sm text-muted-foreground">
              We don't have a fixed timeline. The beta will continue until we're
              confident the product is stable and feature-complete. You'll be
              notified well in advance of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
