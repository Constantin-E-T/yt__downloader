import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, FileText, Sparkles } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Link2,
    title: "Paste YouTube URL",
    description:
      "Copy any YouTube video URL and paste it into the input field. Works with all public videos.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: 2,
    icon: FileText,
    title: "Get Instant Transcript",
    description:
      "Our backend fetches and processes the transcript in seconds. View timestamps and full text immediately.",
    color: "from-purple-500 to-pink-500",
  },
  {
    number: 3,
    icon: Sparkles,
    title: "Analyze with AI",
    description:
      "Generate summaries, extract insights, ask questions, and export your findings. All powered by advanced AI.",
    color: "from-amber-500 to-orange-500",
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Three simple steps to transform any YouTube video into actionable
            insights
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 lg:block" />

          <div className="space-y-12">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative flex flex-col gap-6 lg:flex-row lg:items-center"
                >
                  {/* Number Badge */}
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-background ring-4 ring-background lg:ml-0">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${step.color}`}
                    >
                      <Badge
                        variant="secondary"
                        className="h-8 w-8 rounded-full p-0 text-lg font-bold"
                      >
                        {step.number}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Card */}
                  <Card className="flex-1 border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                    <CardContent className="flex gap-6 p-6">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${step.color}`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
