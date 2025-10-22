import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Brain, Sparkles, Search, Download, Zap } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Instant Transcript Download",
    description:
      "Get full YouTube video transcripts in seconds. Supports multiple languages and formats.",
    color: "text-blue-500",
  },
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description:
      "Generate brief overviews, detailed synopses, or key takeaways with advanced AI models.",
    color: "text-purple-500",
  },
  {
    icon: Sparkles,
    title: "Smart Content Extraction",
    description:
      "Automatically extract code snippets, quotes, and action items from video transcripts.",
    color: "text-amber-500",
  },
  {
    icon: Search,
    title: "Searchable Transcripts",
    description:
      "Find specific moments instantly with powerful search. Jump to any timestamp with one click.",
    color: "text-green-500",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Download transcripts and AI analysis in multiple formats. Share insights with your team.",
    color: "text-red-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Server-side rendering and smart caching ensure instant results. No waiting around.",
    color: "text-cyan-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything You Need to Analyze Videos
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful features designed to help you extract maximum value from
            YouTube content
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-2 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
